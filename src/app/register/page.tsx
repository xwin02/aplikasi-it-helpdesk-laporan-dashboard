"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Password dan konfirmasi password tidak sama");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }

    setIsLoading(true);

    try {
      // Use custom register endpoint that saves role
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          role: "user", // Always register as user
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMap: Record<string, string> = {
          DUPLICATE_EMAIL: "Email sudah terdaftar",
          INVALID_EMAIL: "Format email tidak valid",
          INVALID_PASSWORD_LENGTH: "Password minimal 8 karakter",
          INVALID_ROLE: "Role tidak valid",
          EMPTY_FIELDS: "Semua field harus diisi",
          MISSING_REQUIRED_FIELDS: "Semua field harus diisi",
        };
        toast.error(errorMap[data.code] || data.error || "Pendaftaran gagal");
        setIsLoading(false);
        return;
      }

      toast.success("Akun berhasil dibuat! Silakan login.");
      router.push("/login?registered=true");
    } catch (error) {
      console.error("Registration error:", error);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Image 
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/logommg-1761793499870.png"
              alt="PT Mamagreen Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl text-center">Daftar Akun Baru</CardTitle>
          <CardDescription className="text-center">
            Buat akun untuk mengakses IT Helpdesk System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 8 karakter"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Daftar"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                Login di sini
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}