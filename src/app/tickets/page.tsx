"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Filter, Trash2, Edit, Eye, AlertCircle, Ticket, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  requesterName: string;
  department: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
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

const DEPARTMENTS = [
  "IT",
  "Sales",
  "PPIC",
  "RND",
  "ACC-Finance",
  "Exim",
  "QC",
  "Maintenance",
  "HRD",
  "CreativeDesign",
  "Produksi",
  "Security",
  "VIP"
] as const;

export default function TicketsPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
    requesterName: "",
    department: "",
  });

  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
    requesterName: "",
    department: "",
    assignedTo: "unassigned",
  });

  // Check authentication
  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push("/login?redirect=/tickets");
    }
  }, [session, sessionLoading, router]);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/tickets?limit=100", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push("/login?redirect=/tickets");
        return;
      }

      if (!response.ok) {
        throw new Error("Gagal mengambil data tiket");
      }

      const data = await response.json();
      setTickets(data);
      setFilteredTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
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

  useEffect(() => {
    fetchTickets();
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = tickets;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.requesterName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.priority === priorityFilter);
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.category === categoryFilter);
    }

    setFilteredTickets(filtered);
  }, [searchQuery, statusFilter, priorityFilter, categoryFilter, tickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        router.push("/login?redirect=/tickets");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal membuat tiket");
      }

      toast.success("Tiket berhasil dibuat!");
      setIsCreateDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        category: "",
        requesterName: "",
        department: "",
      });
      fetchTickets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description,
          priority: editFormData.priority,
          category: editFormData.category,
          requesterName: editFormData.requesterName,
          department: editFormData.department,
          assignedTo: editFormData.assignedTo === "unassigned" ? null : editFormData.assignedTo,
        }),
      });

      if (response.status === 401) {
        router.push("/login?redirect=/tickets");
        return;
      }

      if (response.status === 403) {
        toast.error("Anda tidak memiliki izin untuk mengedit tiket");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengupdate tiket");
      }

      toast.success("Tiket berhasil diupdate!");
      setIsEditDialogOpen(false);
      fetchTickets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ticketId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.status === 401) {
        router.push("/login?redirect=/tickets");
        return;
      }

      if (response.status === 403) {
        toast.error("Anda tidak memiliki izin untuk mengubah status tiket");
        return;
      }

      if (!response.ok) {
        throw new Error("Gagal mengupdate status tiket");
      }

      toast.success("Status tiket berhasil diupdate!");
      fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        const updatedTicket = await response.json();
        setSelectedTicket(updatedTicket);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tiket ini?")) {
      return;
    }

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push("/login?redirect=/tickets");
        return;
      }

      if (response.status === 403) {
        toast.error("Anda tidak memiliki izin untuk menghapus tiket");
        return;
      }

      if (!response.ok) {
        throw new Error("Gagal menghapus tiket");
      }

      toast.success("Tiket berhasil dihapus!");
      fetchTickets();
      setIsViewDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const openEditDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditFormData({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      category: ticket.category,
      requesterName: ticket.requesterName,
      department: ticket.department,
      assignedTo: ticket.assignedTo || "unassigned",
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if user is admin or teknisi
  const isAdminOrTeknisi = session?.user?.role === "admin" || session?.user?.role === "teknisi";

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
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
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Ticket Management</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Support Tickets</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isAdminOrTeknisi ? "Kelola dan pantau semua tiket support" : "Buat dan pantau tiket support Anda"}
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105">
                <Plus className="mr-2 h-4 w-4" />
                Buat Tiket Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-emerald-200 dark:border-emerald-800">
              <DialogHeader>
                <DialogTitle className="text-emerald-900 dark:text-emerald-100">Buat Tiket Support Baru</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Isi form di bawah untuk membuat tiket support baru
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Tiket *</Label>
                  <Input
                    id="title"
                    placeholder="Contoh: Laptop tidak bisa charging"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi *</Label>
                  <Textarea
                    id="description"
                    placeholder="Jelaskan masalah secara detail..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioritas</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger id="priority">
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

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      required
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="network">Network</SelectItem>
                        <SelectItem value="access">Access</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="requesterName">Nama Pemohon *</Label>
                    <Input
                      id="requesterName"
                      placeholder="John Doe"
                      value={formData.requesterName}
                      onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Departemen *</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({ ...formData, department: value })}
                      required
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Pilih departemen" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isSubmitting}
                    className="border-emerald-200 dark:border-emerald-800"
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                    {isSubmitting ? "Menyimpan..." : "Buat Tiket"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-emerald-900 dark:text-emerald-100">Daftar Tiket</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {isAdminOrTeknisi 
                ? `Total ${filteredTickets.length} tiket dari ${tickets.length} tiket`
                : `Anda memiliki ${filteredTickets.length} tiket`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari tiket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px] border-emerald-200 dark:border-emerald-800">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-[150px] border-emerald-200 dark:border-emerald-800">
                  <SelectValue placeholder="Prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Prioritas</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[150px] border-emerald-200 dark:border-emerald-800">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                  <SelectItem value="access">Access</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border border-emerald-200 dark:border-emerald-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-emerald-200 dark:border-emerald-800">
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Pemohon</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        <Ticket className="mx-auto h-12 w-12 mb-2 opacity-20 text-emerald-500" />
                        <p>Tidak ada tiket ditemukan</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20">
                        <TableCell className="font-medium text-emerald-700 dark:text-emerald-400">#{ticket.id}</TableCell>
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
                        <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {isAdminOrTeknisi && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(ticket)}
                                className="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-400"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setIsViewDialogOpen(true);
                              }}
                              className="hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950 dark:hover:text-teal-400"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Ticket Dialog - Only for admin/teknisi */}
        {isAdminOrTeknisi && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-emerald-200 dark:border-emerald-800">
              <DialogHeader>
                <DialogTitle className="text-emerald-900 dark:text-emerald-100">Edit Tiket #{selectedTicket?.id}</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Ubah informasi tiket support
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditTicket} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Judul Tiket *</Label>
                  <Input
                    id="edit-title"
                    placeholder="Contoh: Laptop tidak bisa charging"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    required
                    className="border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Deskripsi *</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Jelaskan masalah secara detail..."
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={4}
                    required
                    className="border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-priority">Prioritas</Label>
                    <Select
                      value={editFormData.priority}
                      onValueChange={(value) => setEditFormData({ ...editFormData, priority: value })}
                    >
                      <SelectTrigger id="edit-priority" className="border-emerald-200 dark:border-emerald-800">
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

                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Kategori *</Label>
                    <Select
                      value={editFormData.category}
                      onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
                      required
                    >
                      <SelectTrigger id="edit-category" className="border-emerald-200 dark:border-emerald-800">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="network">Network</SelectItem>
                        <SelectItem value="access">Access</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-assignedTo">Assigned To</Label>
                  <Select
                    value={editFormData.assignedTo}
                    onValueChange={(value) => setEditFormData({ ...editFormData, assignedTo: value })}
                  >
                    <SelectTrigger id="edit-assignedTo" className="border-emerald-200 dark:border-emerald-800">
                      <SelectValue placeholder="Pilih teknisi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Belum ditugaskan</SelectItem>
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
                    <Label htmlFor="edit-requesterName">Nama Pemohon *</Label>
                    <Input
                      id="edit-requesterName"
                      placeholder="John Doe"
                      value={editFormData.requesterName}
                      onChange={(e) => setEditFormData({ ...editFormData, requesterName: e.target.value })}
                      required
                      className="border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-department">Departemen *</Label>
                    <Select
                      value={editFormData.department}
                      onValueChange={(value) => setEditFormData({ ...editFormData, department: value })}
                      required
                    >
                      <SelectTrigger id="edit-department" className="border-emerald-200 dark:border-emerald-800">
                        <SelectValue placeholder="Pilih departemen" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={isSubmitting}
                    className="border-emerald-200 dark:border-emerald-800"
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                    {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* View Ticket Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-emerald-200 dark:border-emerald-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Detail Tiket #{selectedTicket?.id}
              </DialogTitle>
              <DialogDescription>Informasi lengkap tentang tiket support</DialogDescription>
            </DialogHeader>

            {selectedTicket && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{selectedTicket.title}</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className={statusColors[selectedTicket.status]}>
                      {selectedTicket.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline" className={priorityColors[selectedTicket.priority]}>
                      {selectedTicket.priority}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {selectedTicket.category}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pemohon</Label>
                    <p className="text-sm">{selectedTicket.requesterName}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Departemen</Label>
                    <p className="text-sm">{selectedTicket.department}</p>
                  </div>
                </div>

                {isAdminOrTeknisi && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Assigned To</Label>
                      <p className="text-sm">{selectedTicket.assignedTo || "Belum ditugaskan"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Dibuat pada</Label>
                    <p className="text-muted-foreground">{formatDate(selectedTicket.createdAt)}</p>
                  </div>
                  <div>
                    <Label>Diupdate pada</Label>
                    <p className="text-muted-foreground">{formatDate(selectedTicket.updatedAt)}</p>
                  </div>
                </div>

                {selectedTicket.resolvedAt && (
                  <div className="text-sm">
                    <Label>Diselesaikan pada</Label>
                    <p className="text-muted-foreground">{formatDate(selectedTicket.resolvedAt)}</p>
                  </div>
                )}

                <DialogFooter>
                  {isAdminOrTeknisi && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus Tiket
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Tutup
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}