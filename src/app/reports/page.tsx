"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Download, FileText, AlertCircle, Calendar, TrendingUp, Clock, Activity, Sparkles } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface Ticket {
  id: number;
  title: string;
  status: string;
  priority: string;
  category: string;
  requesterName: string;
  createdAt: string;
  resolvedAt: string | null;
}

const statusColors: Record<string, string> = {
  open: "bg-red-500/10 text-red-500 border-red-500/20",
  in_progress: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",
  closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medium: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function ReportsPage() {
  const router = useRouter();
  
  // Session state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "monthly">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  // Interactive filter states
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        
        // Check if user is superadmin or teknisi
        if (data.user.role !== 'superadmin' && data.user.role !== 'teknisi') {
          toast.error("Anda tidak memiliki akses ke halaman ini");
          router.push("/tickets");
          return;
        }
        
        // Pass user directly to avoid stale state
        await fetchReportData(data.user);
      } else {
        router.push("/login?redirect=/reports");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/login?redirect=/reports");
    } finally {
      setSessionLoading(false);
    }
  };

  const fetchReportData = async (user?: any) => {
    setLoading(true);
    setError(null);

    // Use passed user or fall back to state (for subsequent filter-change calls)
    const activeUser = user ?? currentUser;

    try {
      let statsUrl = "/api/tickets/stats";
      let ticketsUrl = "/api/tickets?limit=500";
      const params = new URLSearchParams();

      if (filterType === "monthly" && selectedMonth && selectedYear) {
        params.append("month", selectedMonth);
        params.append("year", selectedYear);
      }

      if (params.toString()) {
        statsUrl += `?${params.toString()}`;
        ticketsUrl += `&${params.toString()}`;
      }

      const [statsResponse, ticketsResponse] = await Promise.all([
        fetch(statsUrl, { credentials: 'include' }),
        fetch(ticketsUrl, { credentials: 'include' }),
      ]);

      if (statsResponse.status === 401 || ticketsResponse.status === 401) {
        toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
        router.push("/login?redirect=/reports");
        return;
      }

      if (!statsResponse.ok || !ticketsResponse.ok) {
        throw new Error("Gagal mengambil data laporan");
      }

      const statsData = await statsResponse.json();
      let ticketsData = await ticketsResponse.json();

      // For teknisi: filter ticket list to only their assigned tickets.
      // Stats API already filters server-side; tickets API returns all for teknisi
      // (teknisi needs all tickets on the Tickets page, but Reports only shows theirs).
      if (activeUser?.role === 'teknisi') {
        ticketsData = ticketsData.filter((t: any) => t.assignedTo === activeUser.id);
      }

      setStats(statsData);
      setTickets(ticketsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch on filter changes, but only if already authenticated
    if (currentUser && !sessionLoading) {
      fetchReportData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, selectedMonth, selectedYear]);

  const exportToCSV = () => {
    if (!tickets.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = ["ID", "Judul", "Status", "Prioritas", "Kategori", "Pemohon", "Dibuat", "Diselesaikan"];
    const csvContent = [
      headers.join(","),
      ...tickets.map((ticket) =>
        [
          ticket.id,
          `"${ticket.title.replace(/"/g, '""')}"`,
          ticket.status,
          ticket.priority,
          ticket.category,
          `"${ticket.requesterName}"`,
          new Date(ticket.createdAt).toLocaleDateString("id-ID"),
          ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString("id-ID") : "-",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `report_${filterType}_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Laporan berhasil diekspor!");
  };

  const exportToPDF = () => {
    if (!tickets.length || !stats) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Add PT Mamagreen Logo - UPDATED SIZE
    const logoUrl = "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/logommg-1761793499870.png";
    
    // Load image and add to PDF
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logoUrl;
    
    img.onload = () => {
      // Add logo - PROPORTIONAL SIZE (keeping aspect ratio)
      doc.addImage(img, "PNG", 15, 10, 20, 20);
      
      // Company Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("PT MAMAGREEN", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("IT Helpdesk System Report", pageWidth / 2, 27, { align: "center" });
      
      // Report Title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const reportTitle = filterType === "monthly" && selectedMonth && selectedYear
        ? `Laporan Tiket - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
        : "Laporan Tiket - Semua Periode";
      doc.text(reportTitle, pageWidth / 2, 38, { align: "center" });
      
      // Line separator
      doc.setLineWidth(0.5);
      doc.line(15, 42, pageWidth - 15, 42);
      
      // Statistics Summary
      let yPos = 50;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Ringkasan Statistik", 15, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const summaryData = [
        ["Total Tiket", stats.total.toString()],
        ["Tingkat Penyelesaian", `${resolutionRate.toFixed(1)}%`],
        ["Waktu Rata-rata Penyelesaian", `${stats.averageResolutionTime.toFixed(1)} jam`],
        ["Tiket Aktif", `${(stats.byStatus.open + stats.byStatus.in_progress)}`]
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [["Metrik", "Nilai"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [22, 163, 74], textColor: 255 },
        margin: { left: 15, right: 15 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Status Breakdown
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Distribusi Status", 15, yPos);
      
      yPos += 5;
      const statusData = [
        ["Open", stats.byStatus.open.toString()],
        ["In Progress", stats.byStatus.in_progress.toString()],
        ["Resolved", stats.byStatus.resolved.toString()],
        ["Closed", stats.byStatus.closed.toString()]
      ];
      
      autoTable(doc, {
        startY: yPos,
        body: statusData,
        theme: "striped",
        margin: { left: 15, right: pageWidth / 2 + 5 }
      });
      
      // Priority Breakdown (side by side)
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Distribusi Prioritas", pageWidth / 2 + 10, yPos);
      
      const priorityData = [
        ["Low", stats.byPriority.low.toString()],
        ["Medium", stats.byPriority.medium.toString()],
        ["High", stats.byPriority.high.toString()],
        ["Urgent", stats.byPriority.urgent.toString()]
      ];
      
      autoTable(doc, {
        startY: yPos + 5,
        body: priorityData,
        theme: "striped",
        margin: { left: pageWidth / 2 + 10, right: 15 }
      });
      
      yPos = Math.max((doc as any).lastAutoTable.finalY) + 10;
      
      // Category Breakdown
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Distribusi Kategori", 15, yPos);
      
      yPos += 5;
      const categoryData = [
        ["Hardware", stats.byCategory.hardware.toString()],
        ["Software", stats.byCategory.software.toString()],
        ["Network", stats.byCategory.network.toString()],
        ["Access", stats.byCategory.access.toString()],
        ["Other", stats.byCategory.other.toString()]
      ];
      
      autoTable(doc, {
        startY: yPos,
        body: categoryData,
        theme: "grid",
        margin: { left: 15, right: 15 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Ticket Details
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Detail Tiket", 15, yPos);
      
      yPos += 5;
      const ticketRows = tickets.slice(0, 50).map(ticket => [
        ticket.id.toString(),
        ticket.title.substring(0, 40) + (ticket.title.length > 40 ? "..." : ""),
        ticket.status.replace("_", " "),
        ticket.priority,
        ticket.category,
        new Date(ticket.createdAt).toLocaleDateString("id-ID")
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [["ID", "Judul", "Status", "Prioritas", "Kategori", "Tanggal"]],
        body: ticketRows,
        theme: "striped",
        headStyles: { fillColor: [22, 163, 74], textColor: 255 },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 8 }
      });
      
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
        doc.text(
          `Dicetak: ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID")}`,
          pageWidth - 15,
          doc.internal.pageSize.height - 10,
          { align: "right" }
        );
      }
      
      // Save PDF
      const filename = `Laporan_IT_Mamagreen_${filterType === "monthly" ? `${selectedMonth}_${selectedYear}` : "All"}_${Date.now()}.pdf`;
      doc.save(filename);
      
      toast.success("Laporan PDF berhasil diekspor!");
    };
    
    img.onerror = () => {
      toast.error("Gagal memuat logo. PDF akan dibuat tanpa logo.");
    };
  };

  const statusData = stats
    ? [
        { name: "Open", value: stats.byStatus.open },
        { name: "In Progress", value: stats.byStatus.in_progress },
        { name: "Resolved", value: stats.byStatus.resolved },
        { name: "Closed", value: stats.byStatus.closed },
      ]
    : [];

  const categoryData = stats
    ? [
        { name: "Hardware", value: stats.byCategory.hardware },
        { name: "Software", value: stats.byCategory.software },
        { name: "Network", value: stats.byCategory.network },
        { name: "Access", value: stats.byCategory.access },
        { name: "Other", value: stats.byCategory.other },
      ]
    : [];

  const priorityData = stats
    ? [
        { name: "Low", value: stats.byPriority.low },
        { name: "Medium", value: stats.byPriority.medium },
        { name: "High", value: stats.byPriority.high },
        { name: "Urgent", value: stats.byPriority.urgent },
      ]
    : [];

  const trendData = stats?.monthlyBreakdown.map((item) => ({
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

  const resolutionRate = stats
    ? ((stats.byStatus.resolved + stats.byStatus.closed) / stats.total) * 100
    : 0;

  // Filter click handlers
  const handleStatusClick = (status: string) => {
    setFilterStatus(filterStatus === status ? null : status);
    setFilterPriority(null);
    setFilterCategory(null);
  };

  const handlePriorityClick = (priority: string) => {
    setFilterPriority(filterPriority === priority ? null : priority);
    setFilterStatus(null);
    setFilterCategory(null);
  };

  const handleCategoryClick = (category: string) => {
    setFilterCategory(filterCategory === category ? null : category);
    setFilterStatus(null);
    setFilterPriority(null);
  };

  const clearFilters = () => {
    setFilterStatus(null);
    setFilterPriority(null);
    setFilterCategory(null);
  };

  // Filter tickets based on active filters
  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus && ticket.status !== filterStatus) return false;
    if (filterPriority && ticket.priority !== filterPriority) return false;
    if (filterCategory && ticket.category !== filterCategory) return false;
    return true;
  });

  const hasActiveFilter = filterStatus || filterPriority || filterCategory;

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
        <div className="container mx-auto p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
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
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {currentUser?.role === 'teknisi' ? '📊 KPI Dashboard Teknisi' : 'Analytics & Insights'}
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              {currentUser?.role === 'teknisi' ? `Dashboard KPI - ${currentUser.name}` : 'Laporan IT Helpdesk'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {currentUser?.role === 'teknisi'
                ? '📌 Menampilkan hanya tiket yang di-assign ke Anda'
                : 'Analisis dan ringkasan performa support ticket'}
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

            <Button onClick={exportToPDF} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40">
              <FileText className="h-4 w-4" />
              Save as PDF
            </Button>

            <Button onClick={exportToCSV} variant="outline" className="border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
            onClick={() => {
              clearFilters();
              document.getElementById('tickets-table')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Tiket</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{stats?.total || 0}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {filterType === "monthly" ? "Bulan ini" : "Semua periode"} • Klik untuk lihat
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-teal-200 dark:border-teal-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Tingkat Penyelesaian</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-900 dark:text-teal-100">{resolutionRate.toFixed(1)}%</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {stats?.byStatus.resolved || 0} resolved, {stats?.byStatus.closed || 0} closed
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-cyan-200 dark:border-cyan-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Waktu Rata-rata</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-900 dark:text-cyan-100">{stats?.averageResolutionTime.toFixed(1) || 0}h</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Penyelesaian tiket</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-green-200 dark:border-green-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
            onClick={() => {
              setFilterStatus('open');
              setFilterPriority(null);
              setFilterCategory(null);
              document.getElementById('tickets-table')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Tiket Aktif</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                {(stats?.byStatus.open || 0) + (stats?.byStatus.in_progress || 0)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {stats?.byStatus.open || 0} open, {stats?.byStatus.in_progress || 0} in progress • Klik untuk lihat
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-emerald-900 dark:text-emerald-100">Distribusi Status</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Breakdown tiket berdasarkan status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#14b8a6" name="Jumlah Tiket" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-teal-200 dark:border-teal-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-teal-900 dark:text-teal-100">Distribusi Prioritas</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Breakdown tiket berdasarkan prioritas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#f59e0b" name="Jumlah Tiket" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-emerald-900 dark:text-emerald-100">Tren Tiket Bulanan</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Grafik tren tiket dalam 12 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tickets" stroke="#10b981" strokeWidth={2} name="Jumlah Tiket" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Kategori</CardTitle>
            <CardDescription>Breakdown tiket berdasarkan kategori masalah</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#10b981" name="Jumlah Tiket" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ringkasan Statistik</CardTitle>
                <CardDescription>Detail statistik tiket - Klik angka untuk filter</CardDescription>
              </div>
              {hasActiveFilter && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-xs border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div 
                    className={`space-y-1 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                      filterStatus === 'open' 
                        ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleStatusClick('open')}
                  >
                    <p className="text-sm text-muted-foreground">Open</p>
                    <p className="text-2xl font-bold">{stats?.byStatus.open || 0}</p>
                  </div>
                  <div 
                    className={`space-y-1 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                      filterStatus === 'in_progress' 
                        ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleStatusClick('in_progress')}
                  >
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold">{stats?.byStatus.in_progress || 0}</p>
                  </div>
                  <div 
                    className={`space-y-1 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                      filterStatus === 'resolved' 
                        ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleStatusClick('resolved')}
                  >
                    <p className="text-sm text-muted-foreground">Resolved</p>
                    <p className="text-2xl font-bold">{stats?.byStatus.resolved || 0}</p>
                  </div>
                  <div 
                    className={`space-y-1 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                      filterStatus === 'closed' 
                        ? 'bg-gray-100 dark:bg-gray-900/30 border-2 border-gray-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleStatusClick('closed')}
                  >
                    <p className="text-sm text-muted-foreground">Closed</p>
                    <p className="text-2xl font-bold">{stats?.byStatus.closed || 0}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Prioritas</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div 
                    className={`space-y-1 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                      filterPriority === 'low' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handlePriorityClick('low')}
                  >
                    <p className="text-sm text-muted-foreground">Low</p>
                    <p className="text-2xl font-bold">{stats?.byPriority.low || 0}</p>
                  </div>
                  <div 
                    className={`space-y-1 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                      filterPriority === 'medium' 
                        ? 'bg-cyan-100 dark:bg-cyan-900/30 border-2 border-cyan-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handlePriorityClick('medium')}
                  >
                    <p className="text-sm text-muted-foreground">Medium</p>
                    <p className="text-2xl font-bold">{stats?.byPriority.medium || 0}</p>
                  </div>
                  <div 
                    className={`space-y-1 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                      filterPriority === 'high' 
                        ? 'bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handlePriorityClick('high')}
                  >
                    <p className="text-sm text-muted-foreground">High</p>
                    <p className="text-2xl font-bold">{stats?.byPriority.high || 0}</p>
                  </div>
                  <div 
                    className={`space-y-1 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                      filterPriority === 'urgent' 
                        ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handlePriorityClick('urgent')}
                  >
                    <p className="text-sm text-muted-foreground">Urgent</p>
                    <p className="text-2xl font-bold">{stats?.byPriority.urgent || 0}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Kategori</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  <div 
                    className={`space-y-1 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                      filterCategory === 'hardware' 
                        ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleCategoryClick('hardware')}
                  >
                    <p className="text-sm text-muted-foreground">Hardware</p>
                    <p className="text-2xl font-bold">{stats?.byCategory.hardware || 0}</p>
                  </div>
                  <div 
                    className={`space-y-1 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                      filterCategory === 'software' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleCategoryClick('software')}
                  >
                    <p className="text-sm text-muted-foreground">Software</p>
                    <p className="text-2xl font-bold">{stats?.byCategory.software || 0}</p>
                  </div>
                  <div 
                    className={`space-y-1 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                      filterCategory === 'network' 
                        ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleCategoryClick('network')}
                  >
                    <p className="text-sm text-muted-foreground">Network</p>
                    <p className="text-2xl font-bold">{stats?.byCategory.network || 0}</p>
                  </div>
                  <div 
                    className={`space-y-1 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                      filterCategory === 'access' 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleCategoryClick('access')}
                  >
                    <p className="text-sm text-muted-foreground">Access</p>
                    <p className="text-2xl font-bold">{stats?.byCategory.access || 0}</p>
                  </div>
                  <div 
                    className={`space-y-1 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                      filterCategory === 'other' 
                        ? 'bg-gray-100 dark:bg-gray-900/30 border-2 border-gray-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleCategoryClick('other')}
                  >
                    <p className="text-sm text-muted-foreground">Other</p>
                    <p className="text-2xl font-bold">{stats?.byCategory.other || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="tickets-table">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {currentUser?.role === 'teknisi' ? '📋 Tiket Saya' : 'Detail Tiket'}
                </CardTitle>
                <CardDescription>
                  {currentUser?.role === 'teknisi'
                    ? 'Tiket yang di-assign ke Anda'
                    : 'Daftar tiket berdasarkan filter yang dipilih'}
                  {hasActiveFilter && (
                    <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                      ({filteredTickets.length} dari {tickets.length} tiket)
                    </span>
                  )}
                </CardDescription>
              </div>
              {hasActiveFilter && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500">
                    Filter Aktif: {filterStatus ? `Status: ${filterStatus.replace('_', ' ')}` : filterPriority ? `Prioritas: ${filterPriority}` : `Kategori: ${filterCategory}`}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={clearFilters}
                    className="text-xs border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                    Clear Filter
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Pemohon</TableHead>
                    <TableHead>Dibuat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {hasActiveFilter ? 'Tidak ada tiket yang sesuai dengan filter' : 'Tidak ada data tiket'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">#{ticket.id}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{ticket.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[ticket.status]}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={priorityColors[ticket.priority]}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{ticket.category}</TableCell>
                        <TableCell>{ticket.requesterName}</TableCell>
                        <TableCell>
                          {new Date(ticket.createdAt).toLocaleDateString("id-ID")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}