"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  AlertCircle,
  Plus,
  ListTodo,
  Calendar,
  Clock,
  User,
  Filter,
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
  subtaskCount: number;
  commentCount: number;
  attachmentCount: number;
}

interface Project {
  id: number;
  title: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

function TasksContent() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filters, setFilters] = useState({
    projectId: projectIdParam || "all-projects",
    status: "all-statuses",
    priority: "all-priorities",
    assignedTo: "all-users",
  });

  const [formData, setFormData] = useState({
    projectId: projectIdParam || "",
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assignedTo: "unassigned",
    startDate: "",
    dueDate: "",
    estimatedHours: "",
    progress: "0",
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchTasks();
      fetchProjects();
      fetchUsers();
    }
  }, [session, filters]);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("bearer_token");
      const params = new URLSearchParams();
      if (filters.projectId && filters.projectId !== "all-projects") params.append("projectId", filters.projectId);
      if (filters.status && filters.status !== "all-statuses") params.append("status", filters.status);
      if (filters.priority && filters.priority !== "all-priorities") params.append("priority", filters.priority);
      if (filters.assignedTo && filters.assignedTo !== "all-users") params.append("assignedTo", filters.assignedTo);

      const response = await fetch(`/api/pm/tasks?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/pm/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/pm/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: parseInt(formData.projectId),
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          priority: formData.priority,
          assignedTo: formData.assignedTo === "unassigned" ? null : formData.assignedTo,
          startDate: formData.startDate || null,
          dueDate: formData.dueDate || null,
          estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
          progress: parseInt(formData.progress),
        }),
      });

      if (!response.ok) throw new Error("Failed to create task");

      toast.success("Task berhasil dibuat!");
      setIsCreateOpen(false);
      setFormData({
        projectId: projectIdParam || "",
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        assignedTo: "unassigned",
        startDate: "",
        dueDate: "",
        estimatedHours: "",
        progress: "0",
      });
      fetchTasks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-sage/10 text-sage dark:bg-sage/20 border border-sage/30";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "review":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "todo":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
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
        return "bg-sage";
      default:
        return "bg-gray-500";
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
        <div className="container mx-auto p-6">
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-green-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto p-6 space-y-6 relative z-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mb-2">
              <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Task Management</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Tasks</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kelola dan track semua tasks Anda
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40">
                <Plus className="h-4 w-4" />
                Buat Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-emerald-200 dark:border-emerald-800">
              <form onSubmit={handleCreateTask}>
                <DialogHeader>
                  <DialogTitle>Buat Task Baru</DialogTitle>
                  <DialogDescription>
                    Tambahkan task baru ke project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectId">Project *</Label>
                    <Select
                      value={formData.projectId || undefined}
                      onValueChange={(value) =>
                        setFormData({ ...formData, projectId: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Task *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
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
                      <Label htmlFor="priority">Prioritas</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) =>
                          setFormData({ ...formData, priority: value })
                        }
                      >
                        <SelectTrigger>
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
                    <Label htmlFor="assignedTo">Assign ke</Label>
                    <Select
                      value={formData.assignedTo}
                      onValueChange={(value) =>
                        setFormData({ ...formData, assignedTo: value })
                      }
                    >
                      <SelectTrigger>
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
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({ ...formData, startDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) =>
                          setFormData({ ...formData, dueDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimatedHours">Estimated Hours</Label>
                      <Input
                        id="estimatedHours"
                        type="number"
                        min="0"
                        value={formData.estimatedHours}
                        onChange={(e) =>
                          setFormData({ ...formData, estimatedHours: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="progress">Progress (%)</Label>
                      <Input
                        id="progress"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) =>
                          setFormData({ ...formData, progress: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  >
                    {isSubmitting ? "Membuat..." : "Buat Task"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
              <Filter className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="filterProject">Project</Label>
                <Select
                  value={filters.projectId}
                  onValueChange={(value) =>
                    setFilters({ ...filters, projectId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-projects">All projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filterStatus">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-statuses">All statuses</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filterPriority">Priority</Label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) =>
                    setFilters({ ...filters, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-priorities">All priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filterAssigned">Assigned To</Label>
                <Select
                  value={filters.assignedTo}
                  onValueChange={(value) =>
                    setFilters({ ...filters, assignedTo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-users">All users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <Card className="text-center py-12 hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardContent>
              <ListTodo className="h-12 w-12 mx-auto text-emerald-500/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-emerald-900 dark:text-emerald-100">Belum ada task</h3>
              <p className="text-muted-foreground mb-4">
                Mulai dengan membuat task pertama Anda
              </p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Link key={task.id} href={`/pm/tasks/${task.id}`}>
                <Card className="hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer border-emerald-100 dark:border-emerald-900 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-1 h-full rounded-full ${getPriorityColor(task.priority)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{task.title}</h3>
                              {isOverdue(task.dueDate) && task.status !== "completed" && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(task.dueDate).toLocaleDateString("id-ID")}</span>
                            </div>
                          )}
                          {task.estimatedHours && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{task.estimatedHours}h estimated</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span>Progress: {task.progress}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {task.subtaskCount > 0 && (
                              <span>✓ {task.subtaskCount}</span>
                            )}
                            {task.commentCount > 0 && (
                              <span>💬 {task.commentCount}</span>
                            )}
                            {task.attachmentCount > 0 && (
                              <span>📎 {task.attachmentCount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    }>
      <TasksContent />
    </Suspense>
  );
}