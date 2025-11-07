"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Calendar, User, Trash2, Edit, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Project {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  createdBy: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const STATUSES = [
  { value: "backlog", label: "Backlog", color: "bg-gray-500" },
  { value: "todo", label: "To Do", color: "bg-blue-500" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-500" },
  { value: "review", label: "Review", color: "bg-purple-500" },
  { value: "done", label: "Done", color: "bg-green-500" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-gray-600" },
  { value: "medium", label: "Medium", color: "text-blue-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "urgent", label: "Urgent", color: "text-red-600" },
];

function ProjectCard({ project, onEdit, onDelete }: { project: Project; onEdit: (project: Project) => void; onDelete: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priority = PRIORITIES.find((p) => p.value === project.priority);
  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date() && project.status !== "done";

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-3 cursor-move hover:shadow-md transition-shadow">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-semibold line-clamp-2">{project.title}</CardTitle>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {project.description && (
            <CardDescription className="text-xs line-clamp-2 mt-1">{project.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className={priority?.color}>
              {priority?.label}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Overdue
              </Badge>
            )}
          </div>
          {project.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <Calendar className="h-3 w-3" />
              {new Date(project.dueDate).toLocaleDateString("id-ID")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KanbanColumn({ status, projects, onEdit, onDelete }: { status: typeof STATUSES[0]; projects: Project[]; onEdit: (project: Project) => void; onDelete: (id: number) => void }) {
  const projectIds = projects.map((p) => p.id.toString());
  const { setNodeRef, isOver } = useDroppable({
    id: status.value,
  });

  return (
    <div className="flex-1 min-w-[280px]">
      <div className={`${status.color} text-white rounded-t-lg px-4 py-2`}>
        <h3 className="font-semibold text-sm flex items-center justify-between">
          {status.label}
          <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
            {projects.length}
          </Badge>
        </h3>
      </div>
      <div 
        ref={setNodeRef}
        className={`bg-muted/30 rounded-b-lg p-3 min-h-[500px] transition-colors ${
          isOver ? "bg-muted/50 ring-2 ring-primary/50" : ""
        }`}
      >
        <SortableContext items={projectIds} strategy={verticalListSortingStrategy}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignedTo: "unassigned",
    dueDate: "",
  });

  const userRole = (session?.user as any)?.role || "user";

  // Redirect if not admin/teknisi
  useEffect(() => {
    if (!isPending && (!session?.user || (userRole !== "admin" && userRole !== "teknisi"))) {
      router.push("/");
      toast.error("Anda tidak memiliki akses ke halaman ini");
    }
  }, [session, isPending, router, userRole]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch projects and users
  useEffect(() => {
    if (session?.user && (userRole === "admin" || userRole === "teknisi")) {
      fetchProjects();
      fetchUsers();
    }
  }, [session, userRole]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(data);
      } else {
        toast.error("Gagal memuat projects");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memuat projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const projectId = parseInt(active.id as string);
    const newStatus = over.id as string;

    const project = projects.find((p) => p.id === projectId);
    if (!project || project.status === newStatus) return;

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
    );

    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/projects?id=${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("Status project berhasil diupdate");
    } catch (error) {
      toast.error("Gagal mengupdate status");
      // Revert on error
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: project.status } : p))
      );
    }
  };

  const handleCreateProject = async () => {
    if (!formData.title.trim()) {
      toast.error("Judul project harus diisi");
      return;
    }

    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          assignedTo: formData.assignedTo === "unassigned" ? null : formData.assignedTo,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          createdBy: session?.user?.id,
        }),
      });

      if (res.ok) {
        toast.success("Project berhasil dibuat");
        setIsCreateOpen(false);
        setFormData({ title: "", description: "", priority: "medium", assignedTo: "unassigned", dueDate: "" });
        fetchProjects();
      } else {
        const error = await res.json();
        toast.error(error.error || "Gagal membuat project");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleEditProject = async () => {
    if (!editingProject || !formData.title.trim()) {
      toast.error("Judul project harus diisi");
      return;
    }

    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/projects?id=${editingProject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          assignedTo: formData.assignedTo === "unassigned" ? null : formData.assignedTo,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        }),
      });

      if (res.ok) {
        toast.success("Project berhasil diupdate");
        setIsEditOpen(false);
        setEditingProject(null);
        setFormData({ title: "", description: "", priority: "medium", assignedTo: "unassigned", dueDate: "" });
        fetchProjects();
      } else {
        const error = await res.json();
        toast.error(error.error || "Gagal mengupdate project");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm("Yakin ingin menghapus project ini?")) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/projects?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("Project berhasil dihapus");
        fetchProjects();
      } else {
        toast.error("Gagal menghapus project");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || "",
      priority: project.priority,
      assignedTo: project.assignedTo || "unassigned",
      dueDate: project.dueDate ? project.dueDate.split("T")[0] : "",
    });
    setIsEditOpen(true);
  };

  const activeProject = activeId ? projects.find((p) => p.id.toString() === activeId) : null;

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  if (!session?.user || (userRole !== "admin" && userRole !== "teknisi")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-green-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mb-2">
              <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Kanban Board</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Project Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola project IT dengan kanban board</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40 gap-2">
                <Plus className="h-4 w-4" />
                Buat Project Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-emerald-200 dark:border-emerald-800">
              <DialogHeader>
                <DialogTitle className="text-emerald-900 dark:text-emerald-100">Buat Project Baru</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">Tambahkan project baru ke dalam board</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title">Judul Project *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Masukkan judul project"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Masukkan deskripsi project"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Prioritas</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignedTo">Assign ke</Label>
                  <Select value={formData.assignedTo} onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Belum diassign</SelectItem>
                      {users.filter(u => u.role === "admin" || u.role === "teknisi").map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Deadline</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-emerald-200 dark:border-emerald-800">
                  Batal
                </Button>
                <Button onClick={handleCreateProject} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                  Buat Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-emerald-200 dark:border-emerald-800">
            <DialogHeader>
              <DialogTitle className="text-emerald-900 dark:text-emerald-100">Edit Project</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">Update informasi project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-title">Judul Project *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Masukkan judul project"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Deskripsi</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Masukkan deskripsi project"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-priority">Prioritas</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-assignedTo">Assign ke</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Belum diassign</SelectItem>
                    {users.filter(u => u.role === "admin" || u.role === "teknisi").map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-dueDate">Deadline</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)} className="border-emerald-200 dark:border-emerald-800">
                Batal
              </Button>
              <Button onClick={handleEditProject} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => {
              const statusProjects = projects.filter((p) => p.status === status.value);
              return (
                <KanbanColumn
                  key={status.value}
                  status={status}
                  projects={statusProjects}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteProject}
                />
              );
            })}
          </div>
          <DragOverlay>
            {activeProject ? (
              <Card className="w-[280px] cursor-move shadow-lg rotate-3">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold line-clamp-2">{activeProject.title}</CardTitle>
                </CardHeader>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}