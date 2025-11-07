"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  TrendingUp,
  AlertTriangle,
  Users,
  CalendarDays,
  GanttChartSquare,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  assignedToMe: number;
  overdueTasks: number;
  myProjects: number;
  activeProjects: number;
  completedTasks: number;
  inProgressTasks: number;
}

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectTitle: string;
  projectId: number;
}

interface Activity {
  id: number;
  taskId: number;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details: string | null;
  createdAt: string;
  taskTitle: string;
  projectId: number;
  projectTitle: string;
}

export default function PMDashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("bearer_token");
      
      // Fetch stats
      const statsRes = await fetch("/api/pm/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!statsRes.ok) throw new Error("Failed to fetch stats");
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch my tasks
      const tasksRes = await fetch("/api/pm/dashboard/my-tasks?limit=10", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!tasksRes.ok) throw new Error("Failed to fetch tasks");
      const tasksData = await tasksRes.json();
      setMyTasks(tasksData);

      // Fetch activities
      const activitiesRes = await fetch("/api/pm/dashboard/activities?limit=10", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!activitiesRes.ok) throw new Error("Failed to fetch activities");
      const activitiesData = await activitiesRes.json();
      setActivities(activitiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-sage/10 text-sage-foreground dark:bg-sage/20 border border-sage/20";
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

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ");
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-emerald-200 dark:border-emerald-800">
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
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
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Project Management</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Project Management Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Overview tugas dan aktivitas project Anda
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/projects">
              <Button variant="outline" className="gap-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-400">
                <FolderKanban className="h-4 w-4" />
                Lihat Projects
              </Button>
            </Link>
            <Link href="/pm/calendar">
              <Button variant="outline" className="gap-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-400">
                <CalendarDays className="h-4 w-4" />
                Calendar
              </Button>
            </Link>
            <Link href="/pm/gantt">
              <Button variant="outline" className="gap-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-400">
                <GanttChartSquare className="h-4 w-4" />
                Gantt
              </Button>
            </Link>
            <Link href="/pm/tasks">
              <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40">
                <ListTodo className="h-4 w-4" />
                Kelola Tasks
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Projects</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <FolderKanban className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{stats?.totalProjects || 0}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {stats?.activeProjects || 0} active
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-cyan-200 dark:border-cyan-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned to Me</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                <ListTodo className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-900 dark:text-cyan-100">{stats?.assignedToMe || 0}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {stats?.inProgressTasks || 0} in progress
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-red-200 dark:border-red-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Overdue Tasks</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900 dark:text-red-100">
                {stats?.overdueTasks || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Perlu perhatian</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-teal-200 dark:border-teal-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-900 dark:text-teal-100">{stats?.completedTasks || 0}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tasks selesai</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* My Tasks */}
          <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-emerald-900 dark:text-emerald-100">Tugas Saya</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Task yang di-assign ke Anda</CardDescription>
            </CardHeader>
            <CardContent>
              {myTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Tidak ada task yang di-assign
                </p>
              ) : (
                <div className="space-y-3">
                  {myTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/pm/tasks/${task.id}`}
                      className="block"
                    >
                      <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 transition-colors">
                        <div className={`w-1 h-full rounded-full ${getPriorityColor(task.priority)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{task.title}</p>
                            {isOverdue(task.dueDate) && (
                              <Badge variant="destructive" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{task.projectTitle}</span>
                            <span>•</span>
                            <Badge variant="secondary" className={`text-xs ${getStatusColor(task.status)}`}>
                              {task.status.replace(/_/g, " ")}
                            </Badge>
                            {task.dueDate && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(task.dueDate).toLocaleDateString("id-ID")}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {myTasks.length > 0 && (
                <div className="mt-4">
                  <Link href="/pm/tasks">
                    <Button variant="ghost" className="w-full hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-400">
                      Lihat Semua Tasks →
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="hover:shadow-xl transition-all duration-300 border-teal-200 dark:border-teal-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-teal-900 dark:text-teal-100">Aktivitas Terbaru</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Update dari project Anda</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada aktivitas
                </p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.userName}</span>{" "}
                          <span className="text-muted-foreground">
                            {formatAction(activity.action)}
                          </span>{" "}
                          <Link
                            href={`/pm/tasks/${activity.taskId}`}
                            className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            {activity.taskTitle}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.projectTitle} •{" "}
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
        </div>
      </div>
    </div>
  );
}