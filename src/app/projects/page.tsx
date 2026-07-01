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
  { value: "todo", label: "To Do", icon: ListTodo, color: "bg-gray-500" },
  { value: "in_progress", label: "In Progress", icon: PlayCircle, color: "bg-blue-500" },
  { value: "in_review", label: "In Review", icon: AlertCircle, color: "bg-yellow-500" },
  { value: "done", label: "Done", icon: CheckCircle2, color: "bg-green-500" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-green-600" },
  { value: "medium", label: "Medium", color: "text-yellow-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "urgent", label: "Urgent", color: "text-red-600" },
];

// Draggable Task Card Component
function DraggableTaskCard({
  task,
  assignedName,
  onClick,
}: {
  task: Task;
  assignedName: string | null;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id.toString(),
    data: { task },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "#ef4444";
      case "high":   return "#f97316";
      case "medium": return "#eab308";
      case "low":    return "#22c55e";
      default:       return "#6b7280";
    }
  };

  return (
    <Card
      ref={setNodeRef}
      className="p-3 hover:shadow-lg transition-all mb-3 border-l-4"
      onClick={() => { if (!isDragging) onClick(); }}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        borderLeftColor: getPriorityColor(task.priority),
      }}
      {...listeners}
      {...attributes}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-2 flex-1">{task.title}</h4>
        </div>
        {task.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Badge variant="outline" className={`${PRIORITIES.find((p) => p.value === task.priority)?.color} border-current`}>
            {task.priority}
          </Badge>
          {task.dueDate && (
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
          {task.estimatedHours && (
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="h-3 w-3" />
              {task.estimatedHours}h
            </div>
          )}
        </div>
        {/* Assigned to badge */}
        {assignedName && (
          <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded px-1.5 py-0.5 w-fit">
            <span className="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300">
              {assignedName.charAt(0).toUpperCase()}
            </span>
            <span className="truncate max-w-[120px]">{assignedName}</span>
          </div>
        )}
        {task.progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

// Droppable Column Component
function DroppableColumn({
  status,
  children,
}: {
  status: typeof STATUSES[0];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.value,
  });

  const StatusIcon = status.icon;

  return (
    <Card
      ref={setNodeRef}
      className={`border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md transition-all ${
        isOver ? "ring-2 ring-emerald-500 bg-emerald-50" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <StatusIcon className={`h-5 w-5 ${status.color} text-white rounded p-0.5`} />
          {status.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 min-h-[500px]">{children}</CardContent>
    </Card>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teknisiList, setTeknisiList] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [filterAssignedTo, setFilterAssignedTo] = useState<string>("all");

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    priority: "medium",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    dueDate: "",
    estimatedHours: "",
    assignedTo: "",
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  );

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        // Allow both superadmin and teknisi
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

  const fetchTeknisiList = async () => {
    try {
      // Fetch all assignable users: superadmin + teknisi
      const response = await fetch("/api/users", { credentials: 'include' });
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
    } catch (error) {
      console.error("Create project error:", error);
      toast.error("An error occurred");
    }
  };

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
        setTaskForm({
          title: "",
          description: "",
          priority: "medium",
          status: "todo",
          dueDate: "",
          estimatedHours: "",
          assignedTo: "",
        });
        await fetchTasks(selectedProject);
      } else {
        toast.error("Failed to create task");
      }
    } catch (error) {
      console.error("Create task error:", error);
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
        body: JSON.stringify({
          ...task,
          status: newStatus,
        }),
      });

      if (response.ok) {
        toast.success("Task moved!");
        if (selectedProject) {
          await fetchTasks(selectedProject);
        }
      } else {
        toast.error("Failed to update task");
      }
    } catch (error) {
      console.error("Update task error:", error);
      toast.error("An error occurred");
    }
  };

  const handleDeleteTask = async (taskId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Task deleted successfully!");
        if (selectedProject) {
          await fetchTasks(selectedProject);
        }
      } else {
        toast.error("Failed to delete task");
      }
    } catch (error) {
      console.error("Delete task error:", error);
      toast.error("An error occurred");
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => {
      if (task.status !== status) return false;
      if (filterAssignedTo === "all") return true;
      if (filterAssignedTo === "unassigned") return !task.assignedTo;
      return task.assignedTo === filterAssignedTo;
    });
  };

  // Helper: get name for a user ID
  const getAssignedName = (userId: string | null): string | null => {
    if (!userId) return null;
    const u = teknisiList.find((t) => t.id === userId);
    return u ? u.name : null;
  };

  // Drag and drop handlers
  function handleDragStart(event: DragStartEvent) {
    const taskId = parseInt(event.active.id as string);
    const task = tasks.find((t) => t.id === taskId);
    setActiveTask(task || null);
  }

  function handleDragOver(event: DragOverEvent) {
    // Optional: Add visual feedback during drag over
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveTask(null);

    if (!over) return;

    const taskId = parseInt(active.id as string);
    const newStatus = over.id as string;

    // Check if status actually changed
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      // Optimistically update UI
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      // Update on server
      await handleUpdateTaskStatus(taskId, newStatus);
    }
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto p-6 relative z-10">
        {/* Header */}
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
                Drag & drop tasks between columns • Click to view details
              </p>
            </div>
            <div className="flex gap-2">
              {currentUser?.role === "superadmin" && (
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
                  <span className="font-semibold text-blue-700 dark:text-blue-400">Teknisi Mode:</span> View & edit tasks only
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Selector + Assigned To Filter */}
        {projects.length > 0 && (
          <Card className="mb-6 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <Label className="whitespace-nowrap">Project:</Label>
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

                {/* Assigned To Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Label className="whitespace-nowrap">Assigned To:</Label>
                  <Select
                    value={filterAssignedTo}
                    onValueChange={setFilterAssignedTo}
                  >
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

                <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                  {filterAssignedTo !== "all" && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      Filter aktif
                    </Badge>
                  )}
                  <span>
                    {tasks.filter(t =>
                      filterAssignedTo === "all" ? true :
                      filterAssignedTo === "unassigned" ? !t.assignedTo :
                      t.assignedTo === filterAssignedTo
                    ).length} / {tasks.length} tasks
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kanban Board with Drag & Drop */}
        {projects.length === 0 ? (
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-12 text-center">
              <FolderKanban className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
              <p className="text-gray-600 mb-4">Create your first project to get started</p>
              <Button
                onClick={() => setShowProjectDialog(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
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
                  <DroppableColumn key={status.value} status={status}>
                    <div className="mb-2 flex items-center justify-between">
                      <Badge variant="secondary">{statusTasks.length} tasks</Badge>
                    </div>
                    {statusTasks.map((task) => (
                      <DraggableTaskCard
                        key={task.id}
                        task={task}
                        assignedName={getAssignedName(task.assignedTo)}
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskDetail(true);
                        }}
                      />
                    ))}
                  </DroppableColumn>
                );
              })}
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeTask ? (
                <Card className="p-3 border-l-4 opacity-90 rotate-3 shadow-2xl" style={{ 
                  borderLeftColor: 
                    activeTask.priority === "urgent" ? "#ef4444" :
                    activeTask.priority === "high" ? "#f97316" :
                    activeTask.priority === "medium" ? "#eab308" : "#22c55e"
                }}>
                  <h4 className="font-medium text-sm">{activeTask.title}</h4>
                  <Badge variant="outline" className="mt-2">
                    {activeTask.priority}
                  </Badge>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Create Project Dialog */}
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
                <Label htmlFor="project-priority">Priority</Label>
                <Select
                  value={projectForm.priority}
                  onValueChange={(value) => setProjectForm({ ...projectForm, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowProjectDialog(false)}>
                Cancel
              </Button>
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

      {/* Create Task Dialog */}
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
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select
                    value={taskForm.priority}
                    onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-status">Status</Label>
                  <Select
                    value={taskForm.status}
                    onValueChange={(value) => setTaskForm({ ...taskForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
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
                <Label htmlFor="task-assignedTo">Assign To</Label>
                <Select
                  value={taskForm.assignedTo || "unassigned"}
                  onValueChange={(value) => setTaskForm({ ...taskForm, assignedTo: value === "unassigned" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user (optional)" />
                  </SelectTrigger>
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
              <Button type="button" variant="outline" onClick={() => setShowTaskDialog(false)}>
                Cancel
              </Button>
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
          if (selectedProject) {
            fetchTasks(selectedProject);
          }
        }}
        statuses={STATUSES}
        priorities={PRIORITIES}
        teknisiList={teknisiList}
        currentUserRole={currentUser?.role}
      />
    </div>
  );
}
