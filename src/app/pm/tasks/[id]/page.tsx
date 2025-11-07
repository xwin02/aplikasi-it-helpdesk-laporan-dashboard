"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Plus,
  Clock,
  Edit,
  Trash2,
  MessageSquare,
  Paperclip,
  Activity,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
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
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  progress: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  subtasks: Subtask[];
  comments: Comment[];
  attachments: Attachment[];
  activities: ActivityLog[];
}

interface Subtask {
  id: number;
  taskId: number;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface Attachment {
  id: number;
  taskId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploaderName: string;
  uploaderEmail: string;
  createdAt: string;
}

interface ActivityLog {
  id: number;
  userId: string;
  userName: string;
  action: string;
  details: string | null;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TaskDetailPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
    assignedTo: "",
    startDate: "",
    dueDate: "",
    estimatedHours: "",
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user && taskId) {
      fetchTask();
      fetchUsers();
    }
  }, [session, taskId]);

  const fetchTask = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/pm/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch task");
      const data = await response.json();
      setTask(data);
      setProgressValue(data.progress);
      
      // Set edit form data
      setEditFormData({
        title: data.title,
        description: data.description || "",
        status: data.status,
        priority: data.priority,
        assignedTo: data.assignedTo || "unassigned",
        startDate: data.startDate ? data.startDate.split('T')[0] : "",
        dueDate: data.dueDate ? data.dueDate.split('T')[0] : "",
        estimatedHours: data.estimatedHours?.toString() || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure data is always an array
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.error("Users API returned unexpected format:", data);
          setUsers([]);
        }
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/pm/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description || null,
          status: editFormData.status,
          priority: editFormData.priority,
          assignedTo: editFormData.assignedTo === "unassigned" ? null : editFormData.assignedTo,
          startDate: editFormData.startDate || null,
          dueDate: editFormData.dueDate || null,
          estimatedHours: editFormData.estimatedHours ? parseInt(editFormData.estimatedHours) : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update task");

      toast.success("Task berhasil diupdate!");
      setIsEditOpen(false);
      fetchTask();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengupdate task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/pm/subtasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: parseInt(taskId),
          title: newSubtask.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to add subtask");

      toast.success("Subtask berhasil ditambahkan!");
      setNewSubtask("");
      fetchTask();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan subtask");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSubtask = async (subtaskId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/pm/subtasks/${subtaskId}/toggle`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to toggle subtask");
      
      toast.success("Subtask updated!");
      fetchTask();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengupdate subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/pm/subtasks/${subtaskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete subtask");

      toast.success("Subtask berhasil dihapus!");
      fetchTask();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus subtask");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/pm/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: parseInt(taskId),
          content: newComment.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to add comment");

      toast.success("Komentar berhasil ditambahkan!");
      setNewComment("");
      fetchTask();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan komentar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!task) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/pm/tasks/${taskId}/progress`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          progress: progressValue,
        }),
      });

      if (!response.ok) throw new Error("Failed to update progress");

      toast.success("Progress berhasil diupdate!");
      fetchTask();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengupdate progress");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "review":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "todo":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-blue-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-green-300/10 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto p-6 space-y-6 relative z-10">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
        <div className="container mx-auto p-6">
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Task not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-green-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto p-6 space-y-6 relative z-10">
        <div className="flex items-center gap-4">
          <Link href="/pm/tasks">
            <Button variant="ghost" size="icon" className="hover:bg-emerald-100 dark:hover:bg-emerald-900">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mb-2">
              <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Task Details</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">{task.title}</h1>
              <Badge className={getStatusColor(task.status)}>
                {task.status.replace(/_/g, " ")}
              </Badge>
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
            </div>
            {task.description && (
              <p className="text-gray-600 dark:text-gray-400">{task.description}</p>
            )}
          </div>
          <Button 
            variant="outline" 
            className="gap-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/50" 
            onClick={() => setIsEditOpen(true)}
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>

        {/* Edit Task Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-emerald-200 dark:border-emerald-800">
            <form onSubmit={handleEditTask}>
              <DialogHeader>
                <DialogTitle className="text-emerald-900 dark:text-emerald-100">Edit Task</DialogTitle>
                <DialogDescription>
                  Update informasi task
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Judul Task *</Label>
                  <Input
                    id="edit-title"
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, title: e.target.value })
                    }
                    className="border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Deskripsi</Label>
                  <Textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, description: e.target.value })
                    }
                    className="border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editFormData.status}
                      onValueChange={(value) =>
                        setEditFormData({ ...editFormData, status: value })
                      }
                    >
                      <SelectTrigger className="border-emerald-200 dark:border-emerald-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-priority">Prioritas</Label>
                    <Select
                      value={editFormData.priority}
                      onValueChange={(value) =>
                        setEditFormData({ ...editFormData, priority: value })
                      }
                    >
                      <SelectTrigger className="border-emerald-200 dark:border-emerald-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-assignedTo">Assign ke</Label>
                  <Select
                    value={editFormData.assignedTo}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, assignedTo: value })
                    }
                  >
                    <SelectTrigger className="border-emerald-200 dark:border-emerald-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Belum diassign</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startDate">Start Date</Label>
                    <div className="relative">
                      <Input
                        id="edit-startDate"
                        type="date"
                        value={editFormData.startDate}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, startDate: e.target.value })
                        }
                        className="border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dueDate">Due Date</Label>
                    <div className="relative">
                      <Input
                        id="edit-dueDate"
                        type="date"
                        value={editFormData.dueDate}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, dueDate: e.target.value })
                        }
                        className="border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-estimatedHours">Estimasi Jam</Label>
                  <Input
                    id="edit-estimatedHours"
                    type="number"
                    min="0"
                    value={editFormData.estimatedHours}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, estimatedHours: e.target.value })
                    }
                    className="border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isSubmitting}
                  className="border-emerald-200 dark:border-emerald-800"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">{task.progress}%</div>
              <Progress value={task.progress} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Subtasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                {completedSubtasks}/{totalSubtasks}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalSubtasks > 0
                  ? `${Math.round((completedSubtasks / totalSubtasks) * 100)}% complete`
                  : "No subtasks"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                {task.estimatedHours || 0}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {task.actualHours ? `${task.actualHours}h actual` : "Estimated"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Due Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Not set"}
              </div>
              {task.dueDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(task.dueDate) < new Date() && task.status !== "completed"
                    ? "Overdue"
                    : "On track"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-emerald-200 dark:border-emerald-800">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="subtasks">
              Subtasks ({totalSubtasks})
            </TabsTrigger>
            <TabsTrigger value="comments">
              Comments ({task.comments.length})
            </TabsTrigger>
            <TabsTrigger value="attachments">
              Attachments ({task.attachments.length})
            </TabsTrigger>
            <TabsTrigger value="activity">
              Activity ({task.activities.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-emerald-900 dark:text-emerald-100">Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={`mt-1 ${getStatusColor(task.status)}`}>
                      {task.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Priority</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                      <span className="text-sm capitalize">{task.priority}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="text-sm mt-1">
                      {task.startDate
                        ? new Date(task.startDate).toLocaleDateString("id-ID")
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                    <p className="text-sm mt-1">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("id-ID")
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-emerald-900 dark:text-emerald-100">Update Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Progress: {progressValue}%</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={progressValue}
                      onChange={(e) => setProgressValue(parseInt(e.target.value) || 0)}
                      className="w-24 border-emerald-200 dark:border-emerald-800"
                    />
                  </div>
                  <Progress value={progressValue} />
                </div>
                <Button
                  onClick={handleUpdateProgress}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  Update Progress
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subtasks" className="space-y-4">
            <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-emerald-900 dark:text-emerald-100">Subtasks</CardTitle>
                <CardDescription>
                  Break down this task into smaller actionable items
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddSubtask} className="flex gap-2">
                  <Input
                    placeholder="Add a new subtask..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    className="border-emerald-200 dark:border-emerald-800"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting || !newSubtask.trim()}
                    className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </form>

                <div className="space-y-2">
                  {task.subtasks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No subtasks yet
                    </p>
                  ) : (
                    task.subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-3 p-3 border border-emerald-200 dark:border-emerald-800 rounded-lg bg-white/50 dark:bg-gray-900/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors"
                      >
                        <Checkbox
                          checked={subtask.completed}
                          onCheckedChange={() => handleToggleSubtask(subtask.id)}
                        />
                        <span
                          className={`flex-1 ${
                            subtask.completed ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {subtask.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          className="hover:bg-red-100 dark:hover:bg-red-900"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-emerald-900 dark:text-emerald-100">Comments</CardTitle>
                <CardDescription>
                  Discuss and collaborate on this task
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddComment} className="space-y-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="border-emerald-200 dark:border-emerald-800"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  >
                    <Send className="h-4 w-4" />
                    Post Comment
                  </Button>
                </form>

                <div className="space-y-4">
                  {task.comments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No comments yet
                    </p>
                  ) : (
                    task.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 border-b border-emerald-200 dark:border-emerald-800 pb-4">
                        <Avatar className="border-2 border-emerald-200 dark:border-emerald-800">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
                            {comment.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{comment.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString("id-ID", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-emerald-900 dark:text-emerald-100">Attachments</CardTitle>
                <CardDescription>
                  Files attached to this task
                </CardDescription>
              </CardHeader>
              <CardContent>
                {task.attachments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No attachments yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {task.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-3 border border-emerald-200 dark:border-emerald-800 rounded-lg bg-white/50 dark:bg-gray-900/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors"
                      >
                        <Paperclip className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{attachment.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.fileSize)} • Uploaded by{" "}
                            {attachment.uploaderName} •{" "}
                            {new Date(attachment.createdAt).toLocaleDateString("id-ID")}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="border-emerald-200 dark:border-emerald-800" asChild>
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-emerald-900 dark:text-emerald-100">Activity Log</CardTitle>
                <CardDescription>
                  Track changes and updates to this task
                </CardDescription>
              </CardHeader>
              <CardContent>
                {task.activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No activity yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {task.activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                          <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.userName}</span>{" "}
                            <span className="text-muted-foreground">
                              {formatAction(activity.action)}
                            </span>
                          </p>
                          {activity.details && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.details}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.createdAt).toLocaleString("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}