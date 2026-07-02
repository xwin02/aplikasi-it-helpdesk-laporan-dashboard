"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, Home, Sparkles, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login gagal. Periksa email dan password Anda.");
        toast.error("Login gagal!");
        return;
      }

      toast.success("Login berhasil!");
      
      // Redirect to tickets
      router.push("/tickets");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Terjadi kesalahan saat login. Silakan coba lagi.");
      toast.error("Login gagal!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950 flex items-center justify-center p-4">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg ring-2 ring-emerald-200 dark:ring-emerald-800">
            <Image 
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/logommg-1761793499870.png"
              alt="PT Mamagreen Logo"
              width={60}
              height={60}
              className="object-contain"
            />
          </div>
        </div>

        <Card className="border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">IT Helpdesk System</span>
              </div>
            </div>
            <CardTitle className="text-3xl text-center bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              Login
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              Masuk ke akun Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">{/* Added pt-2 for spacing */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </>
                )}
              </Button>

              <div className="text-sm text-center space-y-2">
                <p className="text-gray-600 dark:text-gray-400">
                  Belum punya akun?{" "}
                  <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                    Register di sini
                  </Link>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Lupa password?{" "}
                  <Link href="/reset-password" className="text-amber-600 hover:text-amber-700 font-semibold">
                    Reset password
                  </Link>
                </p>
                <Link href="/">
                  <Button variant="ghost" type="button" className="w-full text-gray-600 hover:text-emerald-600">
                    <Home className="mr-2 h-4 w-4" />
                    Kembali ke Beranda
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          © {new Date().getFullYear()} PT Mamagreen Indonesia
        </p>
      </div>
    </div>
  );
}
