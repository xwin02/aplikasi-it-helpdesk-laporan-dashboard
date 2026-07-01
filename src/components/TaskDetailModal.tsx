"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  Paperclip,
  Send,
  Upload,
  Trash2,
  Edit,
  Save,
  Download,
  ZoomIn,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  createdBy: string;
  dueDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
  userEmail: string;
}

interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
}

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  statuses: any[];
  priorities: any[];
  teknisiList?: any[];
  currentUserRole?: string;
}

export function TaskDetailModal({
  task,
  open,
  onClose,
  onUpdate,
  statuses,
  priorities,
  teknisiList = [],
  currentUserRole = "user",
}: TaskDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
    dueDate: "",
    estimatedHours: "",
    actualHours: "",
    progress: 0,
    assignedTo: "",
  });

  useEffect(() => {
    if (task) {
      setTaskForm({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        estimatedHours: task.estimatedHours?.toString() || "",
        actualHours: task.actualHours?.toString() || "",
        progress: task.progress || 0,
        assignedTo: task.assignedTo || "unassigned",
      });
      fetchComments();
      fetchAttachments();
    }
  }, [task]);

  const fetchComments = async () => {
    if (!task) return;
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const fetchAttachments = async () => {
    if (!task) return;
    try {
      const response = await fetch(`/api/tasks/${task.id}/attachments`);
      if (response.ok) {
        const data = await response.json();
        setAttachments(data.attachments);
      }
    } catch (error) {
      console.error("Failed to fetch attachments:", error);
    }
  };

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskForm,
          estimatedHours: taskForm.estimatedHours
            ? parseInt(taskForm.estimatedHours)
            : null,
          actualHours: taskForm.actualHours ? parseInt(taskForm.actualHours) : null,
          assignedTo: taskForm.assignedTo && taskForm.assignedTo !== "unassigned" ? taskForm.assignedTo : null,
        }),
      });

      if (response.ok) {
        toast.success("Task updated successfully!");
        setEditing(false);
        onUpdate();
      } else {
        toast.error("Failed to update task");
      }
    } catch (error) {
      console.error("Update task error:", error);
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        toast.success("Comment added!");
        setNewComment("");
        await fetchComments();
      } else {
        toast.error("Failed to add comment");
      }
    } catch (error) {
      console.error("Add comment error:", error);
      toast.error("An error occurred");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        const response = await fetch(`/api/tasks/${task.id}/attachments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileUrl: base64,
            fileSize: file.size,
            fileType: file.type,
          }),
        });

        if (response.ok) {
          toast.success("Image uploaded!");
          await fetchAttachments();
        } else {
          toast.error("Failed to upload image");
        }
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred");
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm("Delete this attachment?")) return;

    try {
      const response = await fetch(
        `/api/tasks/${task?.id}/attachments?attachmentId=${attachmentId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Attachment deleted!");
        await fetchAttachments();
      } else {
        toast.error("Failed to delete attachment");
      }
    } catch (error) {
      console.error("Delete attachment error:", error);
      toast.error("An error occurred");
    }
  };

  const handleDownloadImage = (attachment: Attachment) => {
    const link = document.createElement("a");
    link.href = attachment.fileUrl;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started!");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (!task) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
          {/* Header - Fixed */}
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-2">
                    <Label>Task Title</Label>
                    <Input
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="text-xl font-bold border-2 focus:border-emerald-500"
                      placeholder="Enter task title..."
                    />
                    <p className="text-xs text-gray-500">Task #{task.id}</p>
                  </div>
                ) : (
                  <>
                    <DialogTitle className="text-2xl mb-1">{task.title}</DialogTitle>
                    <p className="text-sm text-gray-500">Task #{task.id}</p>
                  </>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                {editing ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(false)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(true)}
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Main Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6">
            <div className="grid grid-cols-3 gap-6 py-4">
              {/* Left - Description & Comments (2 columns) */}
              <div className="col-span-2 space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Description</Label>
                  {editing ? (
                    <Textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      rows={6}
                      className="mt-2 resize-none border-2 focus:border-emerald-500"
                      placeholder="Describe the task..."
                    />
                  ) : (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap min-h-[80px]">
                        {task.description || "No description provided"}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Comments */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">
                    Comments ({comments.length})
                  </Label>

                  <div className="space-y-4 mb-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                            {getInitials(comment.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold">{comment.userName}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) {
                          handleAddComment();
                        }
                      }}
                    />
                    <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Press Ctrl+Enter to send</p>
                </div>
              </div>

              {/* Right Sidebar - Status, Priority, etc. (1 column) */}
              <div className="space-y-4">
                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Status</Label>
                  {editing ? (
                    <Select
                      value={taskForm.status}
                      onValueChange={(value) => setTaskForm({ ...taskForm, status: value })}
                    >
                      <SelectTrigger className="mt-1 border-2 focus:border-emerald-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className="mt-1 px-3 py-1">
                      {statuses.find((s) => s.value === task.status)?.label}
                    </Badge>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Priority</Label>
                  {editing ? (
                    <Select
                      value={taskForm.priority}
                      onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}
                    >
                      <SelectTrigger className="mt-1 border-2 focus:border-emerald-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant="outline"
                      className={`mt-1 px-3 py-1 ${
                        priorities.find((p) => p.value === task.priority)?.color
                      } border-current`}
                    >
                      {task.priority.toUpperCase()}
                    </Badge>
                  )}
                </div>

                {/* Assigned To - Superadmin and Teknisi can change */}
                {(currentUserRole === "superadmin" || currentUserRole === "teknisi") && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Assigned To</Label>
                    {editing ? (
                      <Select
                        value={taskForm.assignedTo || "unassigned"}
                        onValueChange={(value) => setTaskForm({ ...taskForm, assignedTo: value === "unassigned" ? "" : value })}
                      >
                        <SelectTrigger className="mt-1 border-2 focus:border-emerald-500">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {teknisiList.map((tek) => (
                            <SelectItem key={tek.id} value={tek.id}>
                              {tek.name} ({tek.email ?? tek.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1 p-2 bg-gray-50 rounded border">
                        <p className="text-sm">
                          {task.assignedTo 
                            ? teknisiList.find((t) => t.id === task.assignedTo)?.name || "Unknown" 
                            : "Unassigned"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Due Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </Label>
                  {editing ? (
                    <Input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="mt-1 border-2 focus:border-emerald-500"
                    />
                  ) : (
                    <div className="mt-1 p-2 bg-gray-50 rounded border">
                      <p className="text-sm">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "No due date"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Time Tracking */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Time Tracking
                  </Label>
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
                    <div>
                      <Label className="text-xs text-gray-600">Estimated Hours</Label>
                      {editing ? (
                        <Input
                          type="number"
                          value={taskForm.estimatedHours}
                          onChange={(e) =>
                            setTaskForm({ ...taskForm, estimatedHours: e.target.value })
                          }
                          placeholder="0"
                          className="mt-1 border-2 focus:border-emerald-500"
                        />
                      ) : (
                        <p className="text-sm font-medium mt-1">
                          {task.estimatedHours ? `${task.estimatedHours} hours` : "Not set"}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Actual Hours</Label>
                      {editing ? (
                        <Input
                          type="number"
                          value={taskForm.actualHours}
                          onChange={(e) =>
                            setTaskForm({ ...taskForm, actualHours: e.target.value })
                          }
                          placeholder="0"
                          className="mt-1 border-2 focus:border-emerald-500"
                        />
                      ) : (
                        <p className="text-sm font-medium mt-1">
                          {task.actualHours ? `${task.actualHours} hours` : "Not tracked"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Progress</Label>
                  {editing ? (
                    <div className="mt-2 space-y-2">
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={taskForm.progress}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, progress: parseInt(e.target.value) })
                        }
                        className="w-full"
                      />
                      <div className="text-center">
                        <span className="text-lg font-bold text-emerald-600">
                          {taskForm.progress}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-emerald-600 h-3 rounded-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <p className="text-center text-sm font-medium mt-1 text-emerald-600">
                        {task.progress}%
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Metadata */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
                  <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments - Fixed at Bottom, Full Width */}
          <div className="border-t bg-gray-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments ({attachments.length})
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Image"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {attachments.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                <ImageIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No attachments yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="group border-2 border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg hover:border-emerald-400 transition-all"
                  >
                    <div className="aspect-video relative bg-gray-100 cursor-pointer" onClick={() => setLightboxImage(att.fileUrl)}>
                      <img
                        src={att.fileUrl}
                        alt={att.fileName}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay with buttons - visible on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 w-7 p-0 bg-white/90 hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage(att.fileUrl);
                          }}
                          title="View full size"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 w-7 p-0 bg-white/90 hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadImage(att);
                          }}
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAttachment(att.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate" title={att.fileName}>
                        {att.fileName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(att.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox for Full Screen View */}
      {lightboxImage && (
        <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="max-w-7xl max-h-[95vh] p-0 bg-black/95 border-0">
            <div className="relative w-full h-[90vh] flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white"
                onClick={() => setLightboxImage(null)}
              >
                <X className="h-6 w-6" />
              </Button>
              <img
                src={lightboxImage}
                alt="Full size"
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const att = attachments.find((a) => a.fileUrl === lightboxImage);
                    if (att) handleDownloadImage(att);
                  }}
                  className="bg-white/90 hover:bg-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Image
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
