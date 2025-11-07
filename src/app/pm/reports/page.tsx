"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ReportData {
  totalTasks: number;
  tasksByStatus: {
    todo: number;
    in_progress: number;
    review: number;
    completed: number;
  };
  tasksByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  completionRate: number;
  overdueTasks: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  averageProgress: number;
  memberCount: number;
  taskCompletionTrend: Array<{
    date: string;
    count: number;
  }>;
}

interface Project {
  id: number;
  title: string;
}

const STATUS_COLORS = {
  todo: "#eab308",
  in_progress: "#3b82f6",
  review: "#a855f7",
  completed: "#10b981",
};

const PRIORITY_COLORS = {
  low: "#10b981",
  medium: "#3b82f6",
  high: "#f59e0b",
  urgent: "#ef4444",
};

export default function ReportsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    projectId: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchProjects();
      fetchReportData();
    }
  }, [session, filters]);

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

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("bearer_token");
      const params = new URLSearchParams();
      if (filters.projectId) params.append("projectId", filters.projectId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/pm/reports/overview?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch report data");
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      projectId: "",
      startDate: "",
      endDate: "",
    });
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

  const statusData = reportData
    ? [
        { name: "To Do", value: reportData.tasksByStatus.todo, color: STATUS_COLORS.todo },
        { name: "In Progress", value: reportData.tasksByStatus.in_progress, color: STATUS_COLORS.in_progress },
        { name: "Review", value: reportData.tasksByStatus.review, color: STATUS_COLORS.review },
        { name: "Completed", value: reportData.tasksByStatus.completed, color: STATUS_COLORS.completed },
      ]
    : [];

  const priorityData = reportData
    ? [
        { name: "Low", value: reportData.tasksByPriority.low, color: PRIORITY_COLORS.low },
        { name: "Medium", value: reportData.tasksByPriority.medium, color: PRIORITY_COLORS.medium },
        { name: "High", value: reportData.tasksByPriority.high, color: PRIORITY_COLORS.high },
        { name: "Urgent", value: reportData.tasksByPriority.urgent, color: PRIORITY_COLORS.urgent },
      ]
    : [];

  const trendData = reportData?.taskCompletionTrend.map((item) => ({
    date: new Date(item.date).toLocaleDateString("id-ID", { month: "short", day: "numeric" }),
    tasks: item.count,
  })) || [];

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
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Analytics & Insights</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Reports & Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Analisis mendalam performa project management Anda
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-emerald-900 dark:text-emerald-100">Filters</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Filter data berdasarkan project dan tanggal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Project</Label>
                <Select value={filters.projectId} onValueChange={(value) => setFilters({ ...filters, projectId: value })}>
                  <SelectTrigger className="border-emerald-200 dark:border-emerald-800">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="border-emerald-200 dark:border-emerald-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="border-emerald-200 dark:border-emerald-800"
                />
              </div>
              <div className="space-y-2 flex items-end">
                <Button variant="outline" onClick={handleResetFilters} className="w-full border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-400">
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Tasks</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{reportData?.totalTasks || 0}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {reportData?.completionRate.toFixed(1)}% completion rate
              </p>
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
              <div className="text-3xl font-bold text-teal-900 dark:text-teal-100">{reportData?.tasksByStatus.completed || 0}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tasks successfully completed</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-red-200 dark:border-red-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Overdue</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900 dark:text-red-100">{reportData?.overdueTasks || 0}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tasks past due date</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-cyan-200 dark:border-cyan-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Progress</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-900 dark:text-cyan-100">{reportData?.averageProgress.toFixed(1)}%</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Average task completion</p>
            </CardContent>
          </Card>
        </div>

        {/* Time Tracking & Team Overview */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-emerald-900 dark:text-emerald-100">Time Tracking</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Estimated vs actual hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Estimated Hours</span>
                    <span className="text-2xl font-bold">{reportData?.totalEstimatedHours || 0}h</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Actual Hours</span>
                    <span className="text-2xl font-bold">{reportData?.totalActualHours || 0}h</span>
                  </div>
                </div>
                {reportData && reportData.totalEstimatedHours > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Variance</span>
                      <Badge
                        variant={
                          reportData.totalActualHours <= reportData.totalEstimatedHours
                            ? "default"
                            : "destructive"
                        }
                      >
                        {reportData.totalActualHours <= reportData.totalEstimatedHours ? "On Track" : "Over Budget"}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-teal-200 dark:border-teal-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-teal-900 dark:text-teal-100">Team Overview</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Project team statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Team Members</span>
                    <span className="text-2xl font-bold">{reportData?.memberCount || 0}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">In Progress Tasks</span>
                    <span className="text-2xl font-bold">{reportData?.tasksByStatus.in_progress || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-emerald-900 dark:text-emerald-100">Tasks by Status</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Distribution berdasarkan status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-teal-200 dark:border-teal-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-teal-900 dark:text-teal-100">Tasks by Priority</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Distribution berdasarkan prioritas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completion Trend */}
        {trendData.length > 0 && (
          <Card className="hover:shadow-xl transition-all duration-300 border-green-200 dark:border-green-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100">Task Completion Trend</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Tasks completed over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tasks" fill="#10b981" name="Completed Tasks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}