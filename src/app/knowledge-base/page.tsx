"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Eye, Trash2, AlertCircle, BookOpen, Tag, Paperclip, Download, X, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/rich-text-editor";

interface FileAttachment {
  fileName: string;
  fileData: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

interface KnowledgeBaseArticle {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string | null;
  author: string;
  attachments: string | null;
  createdAt: string;
  updatedAt: string;
}

const categoryColors: Record<string, string> = {
  hardware: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  software: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  network: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  access: "bg-green-500/10 text-green-500 border-green-500/20",
  other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const CATEGORIES = [
  { value: "hardware", label: "Hardware" },
  { value: "software", label: "Software" },
  { value: "network", label: "Network" },
  { value: "access", label: "Access" },
  { value: "other", label: "Other" },
];

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const [editUploadedFiles, setEditUploadedFiles] = useState<FileAttachment[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "software",
    tags: "",
    author: "",
  });

  const [editFormData, setEditFormData] = useState({
    title: "",
    content: "",
    category: "software",
    tags: "",
    author: "",
  });

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/knowledge-base?limit=100");

      if (!response.ok) {
        throw new Error("Gagal mengambil data artikel");
      }

      const data = await response.json();
      setArticles(data);
      setFilteredArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    let filtered = articles;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (article.tags && article.tags.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((article) => article.category === categoryFilter);
    }

    setFilteredArticles(filtered);
  }, [searchQuery, categoryFilter, articles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (max 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} terlalu besar. Maksimal 10MB per file.`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        newFiles.push({
          fileName: file.name,
          fileData: base64,
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        toast.error(`Gagal mengupload ${file.name}`);
      }
    }

    if (isEdit) {
      setEditUploadedFiles([...editUploadedFiles, ...newFiles]);
    } else {
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
    
    if (newFiles.length > 0) {
      toast.success(`${newFiles.length} file berhasil diupload`);
    }

    // Reset input
    e.target.value = "";
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const removeFile = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditUploadedFiles(editUploadedFiles.filter((_, i) => i !== index));
    } else {
      setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    }
    toast.success("File dihapus");
  };

  const downloadFile = (attachment: FileAttachment) => {
    const link = document.createElement("a");
    link.href = attachment.fileData;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("File berhasil didownload");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("sheet") || fileType.includes("excel")) return "📊";
    if (fileType.includes("image")) return "🖼️";
    return "📎";
  };

  const parseAttachments = (attachmentsJson: string | null): FileAttachment[] => {
    if (!attachmentsJson) return [];
    
    // Skip empty strings or whitespace
    if (typeof attachmentsJson === 'string' && attachmentsJson.trim() === '') return [];
    
    try {
      // If it's already an array (shouldn't happen but just in case)
      if (Array.isArray(attachmentsJson)) {
        return attachmentsJson;
      }
      
      // If it's a string, parse it
      if (typeof attachmentsJson === 'string') {
        // First, try to parse as JSON
        const parsed = JSON.parse(attachmentsJson);
        
        // Ensure it's an array
        if (Array.isArray(parsed)) {
          return parsed;
        }
        
        // If it's a single object, wrap it in an array
        if (typeof parsed === 'object' && parsed !== null) {
          return [parsed];
        }
      }
      
      // If we get here and attachmentsJson is an object, return it wrapped
      if (typeof attachmentsJson === 'object' && attachmentsJson !== null) {
        return Array.isArray(attachmentsJson) ? attachmentsJson : [attachmentsJson];
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing attachments:', error);
      console.error('Raw value type:', typeof attachmentsJson);
      console.error('Raw value:', attachmentsJson);
      return [];
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Sending data:', {
        ...formData,
        attachments: uploadedFiles.length > 0 ? uploadedFiles.length + ' files' : null,
      });

      const response = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          attachments: uploadedFiles.length > 0 ? uploadedFiles : null,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Get response text first to check what we're receiving
      const responseText = await response.text();
      console.log('Response text (first 500 chars):', responseText.substring(0, 500));

      if (!response.ok) {
        // Try to parse as JSON, fallback to text error
        let errorMessage = "Gagal membuat artikel";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = responseText.substring(0, 200);
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      const data = JSON.parse(responseText);
      console.log('Success! Created article:', data);

      toast.success("Artikel berhasil dibuat!");
      setIsCreateDialogOpen(false);
      setFormData({
        title: "",
        content: "",
        category: "software",
        tags: "",
        author: "",
      });
      setUploadedFiles([]);
      fetchArticles();
    } catch (err) {
      console.error('Error creating article:', err);
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticle) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/knowledge-base/${selectedArticle.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editFormData,
          attachments: editUploadedFiles.length > 0 ? editUploadedFiles : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengupdate artikel");
      }

      toast.success("Artikel berhasil diupdate!");
      setIsEditDialogOpen(false);
      fetchArticles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArticle = async (articleId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus artikel ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-base/${articleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus artikel");
      }

      toast.success("Artikel berhasil dihapus!");
      fetchArticles();
      setIsViewDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const openEditDialog = (article: KnowledgeBaseArticle) => {
    setSelectedArticle(article);
    setEditFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags || "",
      author: article.author,
    });
    setEditUploadedFiles(parseAttachments(article.attachments));
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Helper function to strip HTML tags for preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  if (loading) {
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
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Documentation Hub</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Knowledge Base</h1>
            <p className="text-gray-600 dark:text-gray-400">Dokumentasi dan panduan IT Helpdesk</p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105">
                <Plus className="mr-2 h-4 w-4" />
                Buat Artikel Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-emerald-200 dark:border-emerald-800">
              <DialogHeader>
                <DialogTitle className="text-emerald-900 dark:text-emerald-100">Buat Artikel Knowledge Base</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Isi form di bawah untuk membuat artikel baru
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateArticle} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Artikel *</Label>
                  <Input
                    id="title"
                    placeholder="Contoh: Cara Reset Password"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Konten Artikel *</Label>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    placeholder="Mulai menulis artikel dengan format HTML..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>File Lampiran (Opsional)</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={(e) => handleFileUpload(e, false)}
                        className="cursor-pointer"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                      />
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format yang didukung: PDF, DOCX, XLSX, PPTX, TXT, ZIP, RAR (Max 10MB per file)
                    </p>
                    
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <Label className="text-sm">File yang diupload ({uploadedFiles.length}):</Label>
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-lg">{getFileIcon(file.fileType)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.fileName}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(index, false)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      placeholder="password,security,login (pisahkan dengan koma)"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">Penulis *</Label>
                  <Input
                    id="author"
                    placeholder="Nama penulis"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setUploadedFiles([]);
                    }}
                    disabled={isSubmitting}
                    className="border-emerald-200 dark:border-emerald-800"
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                    {isSubmitting ? "Menyimpan..." : "Buat Artikel"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-emerald-900 dark:text-emerald-100">Daftar Artikel</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Total {filteredArticles.length} artikel dari {articles.length} artikel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari artikel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px] border-emerald-200 dark:border-emerald-800">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="mx-auto h-12 w-12 mb-2 opacity-20 text-emerald-500" />
                  <p>Tidak ada artikel ditemukan</p>
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <Card key={article.id} className="hover:shadow-lg transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:scale-[1.01]">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle 
                            className="text-lg cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            onClick={() => {
                              setSelectedArticle(article);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            {article.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 text-gray-600 dark:text-gray-400">
                            {stripHtml(article.content).substring(0, 150)}...
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(article)}
                            className="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-400"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedArticle(article);
                              setIsViewDialogOpen(true);
                            }}
                            className="hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950 dark:hover:text-teal-400"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600 dark:text-gray-400">
                        <Badge variant="outline" className={categoryColors[article.category]}>
                          {article.category}
                        </Badge>
                        {article.tags && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <span className="text-xs">
                              {article.tags.split(',').slice(0, 3).join(', ')}
                            </span>
                          </div>
                        )}
                        <span className="ml-auto">
                          {article.author} • {formatDate(article.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Article Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-emerald-200 dark:border-emerald-800">
            <DialogHeader>
              <DialogTitle>Edit Artikel</DialogTitle>
              <DialogDescription>
                Ubah informasi artikel knowledge base
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditArticle} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Judul Artikel *</Label>
                <Input
                  id="edit-title"
                  placeholder="Contoh: Cara Reset Password"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">Konten Artikel *</Label>
                <RichTextEditor
                  content={editFormData.content}
                  onChange={(content) => setEditFormData({ ...editFormData, content })}
                  placeholder="Mulai menulis artikel dengan format HTML..."
                />
              </div>

              <div className="space-y-2">
                <Label>File Lampiran (Opsional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-file-upload"
                      type="file"
                      multiple
                      onChange={(e) => handleFileUpload(e, true)}
                      className="cursor-pointer"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                    />
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format yang didukung: PDF, DOCX, XLSX, PPTX, TXT, ZIP, RAR (Max 10MB per file)
                  </p>
                  
                  {editUploadedFiles.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <Label className="text-sm">File yang diupload ({editUploadedFiles.length}):</Label>
                      {editUploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-lg">{getFileIcon(file.fileType)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.fileName}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index, true)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Kategori *</Label>
                  <Select
                    value={editFormData.category}
                    onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
                  >
                    <SelectTrigger id="edit-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-tags">Tags</Label>
                  <Input
                    id="edit-tags"
                    placeholder="password,security,login (pisahkan dengan koma)"
                    value={editFormData.tags}
                    onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-author">Penulis *</Label>
                <Input
                  id="edit-author"
                  placeholder="Nama penulis"
                  value={editFormData.author}
                  onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
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

        {/* View Article Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-emerald-200 dark:border-emerald-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {selectedArticle?.title}
              </DialogTitle>
              <div className="flex gap-2 flex-wrap pt-2">
                <Badge variant="outline" className={selectedArticle ? categoryColors[selectedArticle.category] : ""}>
                  {selectedArticle?.category}
                </Badge>
                {selectedArticle?.tags && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    <span>{selectedArticle.tags}</span>
                  </div>
                )}
              </div>
            </DialogHeader>

            {selectedArticle && (
              <div className="space-y-6">
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-blue-500 prose-img:rounded-lg prose-img:shadow-md"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />

                {selectedArticle.attachments && parseAttachments(selectedArticle.attachments).length > 0 ? (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      File Lampiran ({parseAttachments(selectedArticle.attachments).length})
                    </h3>
                    <div className="space-y-2">
                      {parseAttachments(selectedArticle.attachments).map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-lg hover:bg-muted/80 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-2xl">{getFileIcon(file.fileType)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString("id-ID")}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(file)}
                            className="gap-2 hover:bg-emerald-100 hover:text-emerald-700"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  process.env.NODE_ENV === 'development' && (
                    <div className="border-t pt-4 text-sm text-gray-500">
                      <em>Tidak ada file lampiran</em>
                    </div>
                  )
                )}

                <div className="border-t pt-4 text-sm text-muted-foreground">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">Penulis:</span> {selectedArticle.author}
                    </div>
                    <div className="text-right">
                      <div>
                        <span className="font-medium">Dibuat:</span> {formatDate(selectedArticle.createdAt)}
                      </div>
                      <div>
                        <span className="font-medium">Diupdate:</span> {formatDate(selectedArticle.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteArticle(selectedArticle.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Artikel
                  </Button>
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