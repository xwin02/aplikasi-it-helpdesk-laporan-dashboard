"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface Task {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string;
  projectTitle: string;
}

interface CalendarData {
  [date: string]: Task[];
}

export default function CalendarPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchCalendarData();
    }
  }, [session, currentYear, currentMonth]);

  const fetchCalendarData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("bearer_token");
      const params = new URLSearchParams({
        month: (currentMonth + 1).toString(),
        year: currentYear.toString(),
      });

      const response = await fetch(`/api/pm/calendar?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch calendar data");
      const data = await response.json();
      setCalendarData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const getNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-300";
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
        return "border-l-red-500";
      case "high":
        return "border-l-orange-500";
      case "medium":
        return "border-l-blue-500";
      case "low":
        return "border-l-emerald-500";
      default:
        return "border-l-gray-500";
    }
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getTasksForDate = (day: number) => {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarData[dateKey] || [];
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

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
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Calendar View</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Calendar View</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Visualisasi tasks berdasarkan due date
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={getPrevMonth} className="border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-400">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[200px] text-center font-semibold text-emerald-900 dark:text-emerald-100">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <Button variant="outline" size="icon" onClick={getNextMonth} className="border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-400">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-sm text-emerald-700 dark:text-emerald-400 py-2"
                >
                  {day}
                </div>
              ))}

              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="min-h-[120px]" />;
                }

                const tasks = getTasksForDate(day);
                const today = isToday(day);

                return (
                  <div
                    key={day}
                    className={`min-h-[120px] border rounded-lg p-2 transition-colors ${
                      today ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-sm ring-2 ring-emerald-200 dark:ring-emerald-800" : "border-emerald-100 dark:border-emerald-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${today ? "text-emerald-600 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300"}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {tasks.slice(0, 3).map((task) => (
                        <Link key={task.id} href={`/pm/tasks/${task.id}`}>
                          <div
                            className={`text-xs p-1 rounded border-l-2 ${getPriorityColor(
                              task.priority
                            )} bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer truncate transition-colors shadow-sm`}
                          >
                            <div className="font-medium truncate">{task.title}</div>
                            <Badge
                              className={`text-[10px] h-4 px-1 mt-0.5 ${getStatusColor(
                                task.status
                              )}`}
                            >
                              {task.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                      {tasks.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center py-1 bg-emerald-50 dark:bg-emerald-950/20 rounded">
                          +{tasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-teal-200 dark:border-teal-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-teal-900 dark:text-teal-100">Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-l-4 border-l-red-500" />
              <span className="text-sm">Urgent Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-l-4 border-l-orange-500" />
              <span className="text-sm">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-l-4 border-l-blue-500" />
              <span className="text-sm">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-l-4 border-l-emerald-500" />
              <span className="text-sm">Low Priority</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}