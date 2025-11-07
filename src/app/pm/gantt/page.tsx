"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, BarChart3, Sparkles } from "lucide-react";
import Link from "next/link";

interface GanttTask {
  id: number;
  projectId: number;
  title: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  startDate: string;
  dueDate: string;
  progress: number;
  order: number;
  projectTitle: string;
}

interface Project {
  id: number;
  title: string;
}

function GanttContent() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId");

  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectIdParam || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchProjects();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user && selectedProjectId) {
      fetchGanttData();
    }
  }, [session, selectedProjectId]);

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
        if (!selectedProjectId && data.length > 0) {
          setSelectedProjectId(data[0].id.toString());
        }
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  const fetchGanttData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(
        `/api/pm/gantt?projectId=${selectedProjectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch gantt data");
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-sage";
      case "in_progress":
        return "bg-blue-600";
      case "review":
        return "bg-purple-600";
      case "todo":
        return "bg-yellow-600";
      default:
        return "bg-gray-600";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-500";
      case "high":
        return "border-l-orange-500";
      case "medium":
        return "border-l-blue-500";
      case "low":
        return "border-l-sage";
      default:
        return "border-l-gray-500";
    }
  };

  // Calculate timeline range
  const getTimelineRange = () => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 3, 0),
      };
    }

    const dates = tasks.flatMap(task => [
      new Date(task.startDate),
      new Date(task.dueDate)
    ]);

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Add padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    return { start: minDate, end: maxDate };
  };

  const { start: timelineStart, end: timelineEnd } = getTimelineRange();
  const totalDays = Math.ceil(
    (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  const getTaskPosition = (task: GanttTask) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.dueDate);

    const startOffset = Math.ceil(
      (taskStart.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const duration = Math.ceil(
      (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;

    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  // Generate month markers
  const generateMonthMarkers = () => {
    const markers = [];
    let currentDate = new Date(timelineStart);
    currentDate.setDate(1);

    while (currentDate <= timelineEnd) {
      const position =
        ((currentDate.getTime() - timelineStart.getTime()) /
          (timelineEnd.getTime() - timelineStart.getTime())) *
        100;

      markers.push({
        date: new Date(currentDate),
        position: `${position}%`,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return markers;
  };

  const monthMarkers = generateMonthMarkers();

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[600px] w-full" />
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
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Gantt Chart</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Gantt Chart</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Timeline visualization of tasks dan milestones
            </p>
          </div>
        </div>

        <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label className="text-emerald-900 dark:text-emerald-100">Select Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500">
                    <SelectValue placeholder="Select a project" />
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
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-emerald-500/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-emerald-900 dark:text-emerald-100">No tasks with dates</h3>
                <p className="text-muted-foreground">
                  Tasks need both start and due dates to appear in Gantt chart
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Timeline Header */}
                <div className="relative h-12 border-b border-emerald-200 dark:border-emerald-800">
                  {monthMarkers.map((marker, index) => (
                    <div
                      key={index}
                      className="absolute top-0 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                      style={{ left: marker.position }}
                    >
                      {marker.date.toLocaleDateString("id-ID", {
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  ))}
                </div>

                {/* Tasks */}
                <div className="space-y-2">
                  {tasks.map((task) => {
                    const position = getTaskPosition(task);
                    return (
                      <div key={task.id} className="relative h-12 border-b border-emerald-100 dark:border-emerald-900">
                        <div className="absolute left-0 top-0 w-[200px] flex items-center h-full pr-4">
                          <Link href={`/pm/tasks/${task.id}`}>
                            <div
                              className={`text-sm font-medium truncate hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer border-l-4 pl-2 ${getPriorityColor(
                                task.priority
                              )}`}
                            >
                              {task.title}
                            </div>
                          </Link>
                        </div>
                        <div className="absolute left-[200px] right-0 top-0 h-full">
                          <div className="relative h-full">
                            <Link href={`/pm/tasks/${task.id}`}>
                              <div
                                className={`absolute top-2 h-8 rounded ${getStatusColor(
                                  task.status
                                )} cursor-pointer hover:opacity-80 transition-opacity shadow-sm`}
                                style={position}
                              >
                                <div className="h-full flex items-center px-2 text-white text-xs">
                                  <span className="truncate">{task.progress}%</span>
                                </div>
                                {/* Progress overlay */}
                                <div
                                  className="absolute top-0 left-0 h-full bg-white/30 rounded"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-teal-200 dark:border-teal-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-teal-900 dark:text-teal-100">Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-600 rounded" />
                <span className="text-sm">To Do</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded" />
                <span className="text-sm">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-600 rounded" />
                <span className="text-sm">Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-sage rounded" />
                <span className="text-sm">Completed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GanttPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    }>
      <GanttContent />
    </Suspense>
  );
}