"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, Ticket, TrendingUp, Clock, CheckCircle2, XCircle, AlertTriangle, MinusCircle, Sparkles } from "lucide-react";

interface TicketStats {
  total: number;
  byStatus: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  byCategory: {
    hardware: number;
    software: number;
    network: number;
    access: number;
    other: number;
  };
  monthlyBreakdown: Array<{ month: string; count: number }>;
  averageResolutionTime: number;
}

const STATUS_COLORS = {
  open: "#ef4444",
  in_progress: "#f59e0b",
  resolved: "#10b981",
  closed: "#6b7280",
};

const PRIORITY_COLORS = {
  low: "#10b981",
  medium: "#3b82f6",
  high: "#f59e0b",
  urgent: "#ef4444",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "monthly">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = "/api/tickets/stats";
      const params = new URLSearchParams();
      
      if (filterType === "monthly" && selectedMonth && selectedYear) {
        params.append("month", selectedMonth);
        params.append("year", selectedYear);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Gagal mengambil data statistik");
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filterType, selectedMonth, selectedYear]);

  const statusData = stats ? [
    { name: "Open", value: stats.byStatus.open, color: STATUS_COLORS.open },
    { name: "In Progress", value: stats.byStatus.in_progress, color: STATUS_COLORS.in_progress },
    { name: "Resolved", value: stats.byStatus.resolved, color: STATUS_COLORS.resolved },
    { name: "Closed", value: stats.byStatus.closed, color: STATUS_COLORS.closed },
  ] : [];

  const priorityData = stats ? [
    { name: "Low", value: stats.byPriority.low, color: PRIORITY_COLORS.low },
    { name: "Medium", value: stats.byPriority.medium, color: PRIORITY_COLORS.medium },
    { name: "High", value: stats.byPriority.high, color: PRIORITY_COLORS.high },
    { name: "Urgent", value: stats.byPriority.urgent, color: PRIORITY_COLORS.urgent },
  ] : [];

  const categoryData = stats ? [
    { name: "Hardware", value: stats.byCategory.hardware },
    { name: "Software", value: stats.byCategory.software },
    { name: "Network", value: stats.byCategory.network },
    { name: "Access", value: stats.byCategory.access },
    { name: "Other", value: stats.byCategory.other },
  ] : [];

  const monthlyData = stats?.monthlyBreakdown.map(item => ({
    month: item.month,
    tickets: item.count,
  })).reverse() || [];

  const months = [
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
        <div className="container mx-auto p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
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
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Real-time Analytics</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Dashboard IT Helpdesk</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ringkasan statistik dan performa support ticket
            </p>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={filterType} onValueChange={(value: "all" | "monthly") => setFilterType(value)}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-emerald-200 dark:border-emerald-800">
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Data</SelectItem>
                <SelectItem value="monthly">Per Bulan</SelectItem>
              </SelectContent>
            </Select>
            
            {filterType === "monthly" && (
              <>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full sm:w-[140px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-emerald-200 dark:border-emerald-800">
                    <SelectValue placeholder="Pilih bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full sm:w-[120px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-emerald-200 dark:border-emerald-800">
                    <SelectValue placeholder="Pilih tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Tiket</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <Ticket className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{stats?.total || 0}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Semua tiket support
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-red-200 dark:border-red-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Open Tickets</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900 dark:text-red-100">{stats?.byStatus.open || 0}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Menunggu ditangani
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">In Progress</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats?.byStatus.in_progress || 0}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Sedang dikerjakan
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-cyan-200 dark:border-cyan-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Resolution</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-900 dark:text-cyan-100">{stats?.averageResolutionTime.toFixed(1) || 0}h</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Rata-rata penyelesaian
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-emerald-900 dark:text-emerald-100">Status Tiket</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Distribusi berdasarkan status</CardDescription>
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
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1 border-green-200 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Resolved: {stats?.byStatus.resolved || 0}
                </Badge>
                <Badge variant="outline" className="gap-1 border-gray-200 bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300">
                  <XCircle className="h-3 w-3" />
                  Closed: {stats?.byStatus.closed || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-teal-200 dark:border-teal-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-teal-900 dark:text-teal-100">Prioritas Tiket</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Distribusi berdasarkan prioritas</CardDescription>
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
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1 border-red-200 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300">
                  <AlertTriangle className="h-3 w-3" />
                  Urgent: {stats?.byPriority.urgent || 0}
                </Badge>
                <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-3 w-3" />
                  High: {stats?.byPriority.high || 0}
                </Badge>
                <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  <MinusCircle className="h-3 w-3" />
                  Medium: {stats?.byPriority.medium || 0}
                </Badge>
                <Badge variant="outline" className="gap-1 border-green-200 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Low: {stats?.byPriority.low || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-emerald-900 dark:text-emerald-100">Tren Tiket Bulanan</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Volume tiket per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tickets" fill="#14b8a6" name="Jumlah Tiket" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-green-200 dark:border-green-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100">Kategori Tiket</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Distribusi berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" name="Jumlah" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}