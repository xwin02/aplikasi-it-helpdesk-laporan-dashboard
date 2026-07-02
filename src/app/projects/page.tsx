"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  FolderKanban,
  ListTodo,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  Trash2,
  Clock,
  MessageSquare,
  Paperclip,
  User,
  Filter,
  X,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { TaskDetailModal } from "@/components/TaskDetailModal";

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

const STATUSES = [
  { value: "todo", label: "To Do", icon: ListTodo, color: "bg-gray-500", ring: "ring-gray-300", badge: "bg-gray-100 text-gray-700" },
  { value: "in_progress", label: "In Progress", icon: PlayCircle, color: "bg-blue-500", ring: "ring-blue-300", badge: "bg-blue-100 text-blue-700" },
  { value: "in_review", label: "In Review", icon: AlertCircle, color: "bg-yellow-500", ring: "ring-yellow-300", badge: "bg-yellow-100 text-yellow-700" },
  { value: "done", label: "Done", icon: CheckCircle2, color: "bg-green-500", ring: "ring-green-300", badge: "bg-green-100 text-green-700" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-green-600", bg: "bg-green-50 border-green-300" },
  { value: "medium", label: "Medium", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-300" },
  { value: "high", label: "High", color: "text-orange-600", bg: "bg-orange-50 border-orange-300" },
  { value: "urgent", label: "Urgent", color: "text-red-600", bg: "bg-red-50 border-red-300" },
];

function getPriorityColor(priority: string) {
  switch (priority) {
    case "urgent": return "#ef4444";
    case "high":   return "#f97316";
    case "medium": return "#eab308";
    case "low":    return "#22c55e";
    default:       return "#6b7280";
  }
}

// ─── Draggable Task Card ──────────────────────────────────────────────────────
function DraggableTaskCard({
  task,
  assignedName,
  isSuperadmin,
  onClick,
  onDelete,
}: {
  task: Task;
  assignedName: string | null;
  isSuperadmin: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id.toString(),
    data: { task },
  });

  const priorityMeta = PRIORITIES.find((p) => p.value === task.priority);
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <Card
      ref={setNodeRef}
      className={`relative group mb-3 border-l-4 hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-40 scale-95" : "opacity-100"
      }`}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        borderLeftColor: getPriorityColor(task.priority),
      }}
      onClick={() => { if (!isDragging) onClick(); }}
      {...listeners}
      {...attributes}
    >
      {/* Delete button – superadmin only, top-right, visible on hover */}
      {isSuperadmin && (
        <button
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"
          onClick={onDelete}
          title="Delete task"
          type="button"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="p-3 space-y-2">
        {/* Title row */}
        <div className="pr-6">
          <h4 className="font-medium text-sm line-clamp-2 leading-snug">{task.title}</h4>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
        )}

        {/* Priority badge + due date */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded border ${priorityMeta?.bg} ${priorityMeta?.color}`}
          >
            {task.priority.toUpperCase()}
          </span>
          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] ${
                isOverdue ? "text-red-500 font-semibold" : "text-gray-400"
              }`}
            >
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
          {task.estimatedHours && (
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
              <Clock className="h-3 w-3" />
              {task.estimatedHours}h
            </span>
          )}
        </div>

        {/* Assigned to */}
        {assignedName && (
          <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-full px-2 py-0.5 w-fit">
            <span className="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300 shrink-0">
              {assignedName.charAt(0).toUpperCase()}
            </span>
            <span className="truncate max-w-[110px]">{assignedName}</span>
          </div>
        )}

        {/* Progress bar */}
        {task.progress > 0 && (
          <div className="space-y-0.5">
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 text-right">{task.progress}%</p>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Droppable Column ─────────────────────────────────────────────────────────
function DroppableColumn({
  status,
  taskCount,
  children,
}: {
  status: typeof STATUSES[0];
  taskCount: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value });
  const StatusIcon = status.icon;

  return (
    <Card
      ref={setNodeRef}
      className={`border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md transition-all duration-200 ${
        isOver ? "ring-2 ring-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/30 scale-[1.01]" : ""
      }`}
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center justify-between text-sm font-semibold">
          <div className="flex items-center gap-2">
            <span className={`inline-flex p-1 rounded ${status.color}`}>
              <StatusIcon className="h-4 w-4 text-white" />
            </span>
            {status.label}
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status.badge}`}>
            {taskCount}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 min-h-[480px]">
        {children}
        {taskCount === 0 && (
          <div className="mt-2 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 py-8 flex flex-col items-center justify-center text-gray-400 text-xs gap-1">
            <Plus className="h-5 w-5 opacity-40" />
            <span>Drop tasks here</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teknisiList, setTeknisiList] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [filterAssignedTo, setFilterAssignedTo] = useState<string>("all");

  // Dialogs
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);

  // Task detail
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  // Drag overlay
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // New project form
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    priority: "medium",
  });

  // Edit project form
  const [editProjectForm, setEditProjectForm] = useState({
    title: "",
    description: "",
    priority: "medium",
  });
  const [editProjectSaving, setEditProjectSaving] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  // New task form
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    dueDate: "",
    estimatedHours: "",
    assignedTo: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        if (data.user.role !== "superadmin" && data.user.role !== "teknisi") {
          toast.error("Access denied. Superadmin or Teknisi only!");
          router.push("/");
          return;
        }
        setCurrentUser(data.user);
        await fetchProjects();
        await fetchTeknisiList();
      } else {
        router.push("/login?redirect=/projects");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/login");
    }
  };

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchTeknisiList = async () => {
    try {
      const response = await fetch("/api/users", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setTeknisiList(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch assignable users:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
        if (data.projects.length > 0 && !selectedProject) {
          setSelectedProject(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (projectId: number) => {
    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      toast.error("Failed to load tasks");
    }
  };

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
    }
  }, [selectedProject]);

  // ── Project CRUD ──────────────────────────────────────────────────────────
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectForm),
      });
      if (response.ok) {
        toast.success("Project created successfully!");
        setShowProjectDialog(false);
        setProjectForm({ title: "", description: "", priority: "medium" });
        await fetchProjects();
      } else {
        toast.error("Failed to create project");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const openEditProject = () => {
    const proj = projects.find((p) => p.id === selectedProject);
    if (!proj) return;
    setEditProjectForm({
      title: proj.title,
      description: proj.description || "",
      priority: proj.priority,
    });
    setShowEditProjectDialog(true);
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setEditProjectSaving(true);
    try {
      const response = await fetch(`/api/projects/${selectedProject}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProjectForm),
      });
      if (response.ok) {
        toast.success("Project updated!");
        setShowEditProjectDialog(false);
        await fetchProjects();
      } else {
        toast.error("Failed to update project");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setEditProjectSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    setDeletingProject(true);
    try {
      const response = await fetch(`/api/projects/${selectedProject}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Project deleted!");
        setShowDeleteProjectDialog(false);
        setSelectedProject(null);
        await fetchProjects();
      } else {
        toast.error("Failed to delete project");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeletingProject(false);
    }
  };

  // ── Task CRUD ─────────────────────────────────────────────────────────────
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      toast.error("Please select a project first");
      return;
    }
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          ...taskForm,
          estimatedHours: taskForm.estimatedHours ? parseInt(taskForm.estimatedHours) : null,
          assignedTo: taskForm.assignedTo || null,
        }),
      });
      if (response.ok) {
        toast.success("Task created successfully!");
        setShowTaskDialog(false);
        setTaskForm({ title: "", description: "", priority: "medium", status: "todo", dueDate: "", estimatedHours: "", assignedTo: "" });
        await fetchTasks(selectedProject);
      } else {
        toast.error("Failed to create task");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, status: newStatus }),
      });
      if (response.ok) {
        toast.success("Task moved!");
        if (selectedProject) await fetchTasks(selectedProject);
      } else {
        toast.error("Failed to update task");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleDeleteTask = async (taskId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this task?")) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Task deleted!");
        if (selectedProject) await fetchTasks(selectedProject);
      } else {
        toast.error("Failed to delete task");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getTasksByStatus = (status: string) =>
    tasks.filter((task) => {
      if (task.status !== status) return false;
      if (filterAssignedTo === "all") return true;
      if (filterAssignedTo === "unassigned") return !task.assignedTo;
      return task.assignedTo === filterAssignedTo;
    });

  const getAssignedName = (userId: string | null): string | null => {
    if (!userId) return null;
    const u = teknisiList.find((t) => t.id === userId);
    return u ? u.name : null;
  };

  const currentProjectData = projects.find((p) => p.id === selectedProject);
  const isSuperadmin = currentUser?.role === "superadmin";

  // ── Drag handlers ─────────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    const taskId = parseInt(event.active.id as string);
    setActiveTask(tasks.find((t) => t.id === taskId) || null);
  }

  function handleDragOver(_event: DragOverEvent) {}

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const taskId = parseInt(active.id as string);
    const newStatus = over.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
      await handleUpdateTaskStatus(taskId, newStatus);
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
        <div className="container mx-auto p-6">
          <Skeleton className="h-12 w-64 mb-6" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto p-6 relative z-10">
        {/* ── Page header ── */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mb-2">
            <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Project Management
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                Kanban Board
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Drag &amp; drop tasks between columns • Click to view details
              </p>
            </div>
            <div className="flex gap-2">
              {isSuperadmin && (
                <>
                  <Button
                    onClick={() => setShowProjectDialog(true)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  >
                    <FolderKanban className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                  <Button
                    onClick={() => setShowTaskDialog(true)}
                    disabled={!selectedProject}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </>
              )}
              {currentUser?.role === "teknisi" && (
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-950/30 px-4 py-2 rounded-lg">
                  <span className="font-semibold text-blue-700 dark:text-blue-400">Teknisi Mode:</span> View &amp; edit tasks only
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Project stats gradient header ── */}
        {currentProjectData && (
          <div className="mb-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold leading-tight">{currentProjectData.title}</h2>
                {currentProjectData.description && (
                  <p className="text-emerald-100 text-xs mt-0.5 line-clamp-1">{currentProjectData.description}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {STATUSES.map((s) => {
                  const count = tasks.filter((t) => t.status === s.value).length;
                  return (
                    <div key={s.value} className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                      <s.icon className="h-3.5 w-3.5" />
                      <span>{s.label}:</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-1 bg-white/30 rounded-full px-3 py-1 font-semibold">
                  Total: {tasks.length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Project selector + filter bar ── */}
        {projects.length > 0 && (
          <Card className="mb-6 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Label className="whitespace-nowrap">Project:</Label>

                {/* Selector */}
                <Select
                  value={selectedProject?.toString()}
                  onValueChange={(value) => {
                    setSelectedProject(parseInt(value));
                    setFilterAssignedTo("all");
                  }}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Edit / Delete project buttons – superadmin only */}
                {isSuperadmin && selectedProject && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={openEditProject}
                      title="Edit project"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-2 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setShowDeleteProjectDialog(true)}
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {/* Assigned To filter */}
                <div className="flex items-center gap-2 ml-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Label className="whitespace-nowrap">Assigned To:</Label>
                  <Select value={filterAssignedTo} onValueChange={setFilterAssignedTo}>
                    <SelectTrigger className="w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="unassigned">Belum ditugaskan</SelectItem>
                      {teknisiList.map((tek) => (
                        <SelectItem key={tek.id} value={tek.id}>
                          {tek.name} — {tek.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filterAssignedTo !== "all" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-red-500"
                      onClick={() => setFilterAssignedTo("all")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Task count summary */}
                <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                  {filterAssignedTo !== "all" && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">Filter aktif</Badge>
                  )}
                  <span>
                    {tasks.filter((t) =>
                      filterAssignedTo === "all" ? true :
                      filterAssignedTo === "unassigned" ? !t.assignedTo :
                      t.assignedTo === filterAssignedTo
                    ).length}{" "}
                    / {tasks.length} tasks
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Kanban board ── */}
        {projects.length === 0 ? (
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-12 text-center">
              <FolderKanban className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
              <p className="text-gray-600 mb-4">Create your first project to get started</p>
              {isSuperadmin && (
                <Button
                  onClick={() => setShowProjectDialog(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {STATUSES.map((status) => {
                const statusTasks = getTasksByStatus(status.value);
                return (
                  <DroppableColumn key={status.value} status={status} taskCount={statusTasks.length}>
                    {statusTasks.map((task) => (
                      <DraggableTaskCard
                        key={task.id}
                        task={task}
                        assignedName={getAssignedName(task.assignedTo)}
                        isSuperadmin={isSuperadmin}
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskDetail(true);
                        }}
                        onDelete={(e) => handleDeleteTask(task.id, e)}
                      />
                    ))}
                  </DroppableColumn>
                );
              })}
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeTask ? (
                <Card
                  className="p-3 border-l-4 opacity-90 rotate-2 shadow-2xl"
                  style={{ borderLeftColor: getPriorityColor(activeTask.priority) }}
                >
                  <h4 className="font-medium text-sm">{activeTask.title}</h4>
                  <Badge variant="outline" className="mt-2 text-xs">{activeTask.priority}</Badge>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          DIALOGS
      ════════════════════════════════════════════════════════════════════ */}

      {/* Create Project */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Add a new project to manage your tasks</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project-title">Title *</Label>
                <Input
                  id="project-title"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={projectForm.priority}
                  onValueChange={(value) => setProjectForm({ ...projectForm, priority: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowProjectDialog(false)}>Cancel</Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project */}
      <Dialog open={showEditProjectDialog} onOpenChange={setShowEditProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update the project details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProject}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-project-title">Title *</Label>
                <Input
                  id="edit-project-title"
                  value={editProjectForm.title}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project-description">Description</Label>
                <Textarea
                  id="edit-project-description"
                  value={editProjectForm.description}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={editProjectForm.priority}
                  onValueChange={(value) => setEditProjectForm({ ...editProjectForm, priority: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditProjectDialog(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={editProjectSaving}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                {editProjectSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirm */}
      <Dialog open={showDeleteProjectDialog} onOpenChange={setShowDeleteProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-red-600">{currentProjectData?.title}</span>?
              This action cannot be undone and will also remove all associated tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteProjectDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deletingProject}
              onClick={handleDeleteProject}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deletingProject ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task to the selected project</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Title *</Label>
                <Input
                  id="task-title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={taskForm.priority}
                    onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={taskForm.status}
                    onValueChange={(value) => setTaskForm({ ...taskForm, status: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-dueDate">Due Date</Label>
                  <Input
                    id="task-dueDate"
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-estimatedHours">Estimated Hours</Label>
                  <Input
                    id="task-estimatedHours"
                    type="number"
                    value={taskForm.estimatedHours}
                    onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select
                  value={taskForm.assignedTo || "unassigned"}
                  onValueChange={(value) => setTaskForm({ ...taskForm, assignedTo: value === "unassigned" ? "" : value })}
                >
                  <SelectTrigger><SelectValue placeholder="Select user (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teknisiList.map((tek) => (
                      <SelectItem key={tek.id} value={tek.id}>
                        {tek.name} ({tek.email}) — {tek.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">{teknisiList.length} user tersedia</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTaskDialog(false)}>Cancel</Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
              >
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={showTaskDetail}
        onClose={() => {
          setShowTaskDetail(false);
          setSelectedTask(null);
        }}
        onUpdate={() => {
          if (selectedProject) fetchTasks(selectedProject);
        }}
        statuses={STATUSES}
        priorities={PRIORITIES}
        teknisiList={teknisiList}
        currentUserRole={currentUser?.role}
      />
    </div>
  );
}
