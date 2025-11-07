"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Sparkles, Lock, Mail } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionLoading, refetch } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  useEffect(() => {
    if (!sessionLoading && session?.user) {
      // If already logged in, redirect based on role
      const userRole = (session.user as any).role || "user";
      if (userRole === "admin" || userRole === "teknisi") {
        router.push("/dashboard");
      } else {
        router.push("/tickets");
      }
    }
  }, [session, sessionLoading, router]);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      toast.success("Akun berhasil dibuat! Silakan login.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (error?.code) {
        toast.error("Email atau password salah. Pastikan Anda sudah mendaftar dan coba lagi.");
        setIsLoading(false);
        return;
      }

      // Refetch session to update Navigation component
      await refetch();

      // Get user role from session data
      const userRole = (data?.user as any)?.role || "user";

      toast.success("Login berhasil!");

      // Use window.location for full page reload to ensure Navigation updates
      if (userRole === "admin" || userRole === "teknisi") {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/tickets";
      }
    } catch (error) {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-green-300/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-lg ring-2 ring-emerald-200 dark:ring-emerald-800">
              <Image 
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/logommg-1761793499870.png"
                alt="PT Mamagreen Logo"
                width={60}
                height={60}
                className="object-contain"
              />
            </div>
          </div>
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mx-auto">
            <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Secure Access</span>
          </div>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Login ke IT Helpdesk</CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-400">
            Masukkan email dan password Anda untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="pl-10 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  autoComplete="off"
                  className="pl-10 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="remember"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                disabled={isLoading}
                className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer text-gray-600 dark:text-gray-400">
                Ingat saya
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Login"
              )}
            </Button>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Belum punya akun?{" "}
              <Link href="/register" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium">
                Daftar di sini
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}