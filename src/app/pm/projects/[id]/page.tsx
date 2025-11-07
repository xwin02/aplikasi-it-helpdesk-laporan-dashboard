"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Plus,
  Users,
  Flag,
  ListTodo,
  Edit,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  milestones: Milestone[];
  taskStats: {
    total: number;
    completed: number;
    in_progress: number;
    todo: number;
  };
}

interface Milestone {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  dueDate: string;
  completed: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ProjectDetailPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  const [memberForm, setMemberForm] = useState({
    userId: "",
    role: "member",
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user && projectId) {
      fetchProject();
      fetchUsers();
    }
  }, [session, projectId]);

  const fetchProject = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/pm/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch project");
      const data = await response.json();
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/pm/milestones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: parseInt(projectId),
          title: milestoneForm.title,
          description: milestoneForm.description || null,
          dueDate: new Date(milestoneForm.dueDate).toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to add milestone");

      toast.success("Milestone berhasil ditambahkan!");
      setIsAddMilestoneOpen(false);
      setMilestoneForm({ title: "", description: "", dueDate: "" });
      fetchProject();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan milestone");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/pm/project-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: parseInt(projectId),
          userId: memberForm.userId,
          role: memberForm.role,
        }),
      });

      if (!response.ok) throw new Error("Failed to add member");

      toast.success("Member berhasil ditambahkan!");
      setIsAddMemberOpen(false);
      setMemberForm({ userId: "", role: "member" });
      fetchProject();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMilestone = async (milestoneId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/pm/milestones/${milestoneId}/toggle`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to toggle milestone");

      toast.success("Status milestone berhasil diupdate!");
      fetchProject();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengupdate milestone");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "review":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "todo":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "backlog":
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
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isPending || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Project not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const completionPercentage = project.taskStats.total > 0
    ? (project.taskStats.completed / project.taskStats.total) * 100
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pm/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace(/_/g, " ")}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.taskStats.total}</div>
            <Progress value={completionPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {project.taskStats.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {project.taskStats.in_progress}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasks being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.members.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(project.priority)}`} />
              <span className="text-2xl font-bold capitalize">{project.priority}</span>
            </div>
            {project.dueDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Due {new Date(project.dueDate).toLocaleDateString("id-ID")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={`mt-1 ${getStatusColor(project.status)}`}>
                    {project.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)}`} />
                    <span className="text-sm capitalize">{project.priority}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm mt-1">
                    {new Date(project.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                {project.dueDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                    <p className="text-sm mt-1">
                      {new Date(project.dueDate).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/pm/tasks?projectId=${projectId}`}>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <ListTodo className="h-4 w-4" />
                  View All Tasks
                </Button>
              </Link>
              <Link href={`/pm/calendar?projectId=${projectId}`}>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Calendar className="h-4 w-4" />
                  Calendar View
                </Button>
              </Link>
              <Link href={`/pm/gantt?projectId=${projectId}`}>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Flag className="h-4 w-4" />
                  Gantt Chart
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Members ({project.members.length})</CardTitle>
                <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleAddMember}>
                      <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                          Add a new member to this project
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="userId">User *</Label>
                          <Select
                            value={memberForm.userId}
                            onValueChange={(value) =>
                              setMemberForm({ ...memberForm, userId: value })
                            }
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                              {users
                                .filter(
                                  (user) =>
                                    !project.members.some((m) => m.id === user.id)
                                )
                                .map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role *</Label>
                          <Select
                            value={memberForm.role}
                            onValueChange={(value) =>
                              setMemberForm({ ...memberForm, role: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="owner">Owner</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddMemberOpen(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSubmitting ? "Adding..." : "Add Member"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{member.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Milestones ({project.milestones.length})</CardTitle>
                <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4" />
                      Add Milestone
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleAddMilestone}>
                      <DialogHeader>
                        <DialogTitle>Add Milestone</DialogTitle>
                        <DialogDescription>
                          Create a new milestone for this project
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="milestoneTitle">Title *</Label>
                          <Input
                            id="milestoneTitle"
                            value={milestoneForm.title}
                            onChange={(e) =>
                              setMilestoneForm({ ...milestoneForm, title: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="milestoneDescription">Description</Label>
                          <Textarea
                            id="milestoneDescription"
                            value={milestoneForm.description}
                            onChange={(e) =>
                              setMilestoneForm({
                                ...milestoneForm,
                                description: e.target.value,
                              })
                            }
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="milestoneDueDate">Due Date *</Label>
                          <Input
                            id="milestoneDueDate"
                            type="date"
                            value={milestoneForm.dueDate}
                            onChange={(e) =>
                              setMilestoneForm({
                                ...milestoneForm,
                                dueDate: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddMilestoneOpen(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSubmitting ? "Adding..." : "Add Milestone"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {project.milestones.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No milestones yet
                </p>
              ) : (
                <div className="space-y-3">
                  {project.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => handleToggleMilestone(milestone.id)}
                      >
                        <CheckCircle2
                          className={`h-5 w-5 ${
                            milestone.completed
                              ? "text-green-600 fill-green-600"
                              : "text-gray-400"
                          }`}
                        />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium ${
                            milestone.completed ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {milestone.title}
                        </p>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {milestone.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(milestone.dueDate).toLocaleDateString("id-ID")}
                          </span>
                          {milestone.completed && milestone.completedAt && (
                            <>
                              <span>•</span>
                              <span>
                                Completed{" "}
                                {new Date(milestone.completedAt).toLocaleDateString("id-ID")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
