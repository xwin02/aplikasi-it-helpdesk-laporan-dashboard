"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, KeyRound, Home, Sparkles, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [email, setEmail] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-security", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          securityAnswer: securityAnswer.toLowerCase().trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Verifikasi gagal. Periksa email dan jawaban keamanan Anda.");
        toast.error("Verifikasi gagal!");
        return;
      }

      // Success - move to reset step
      setUserId(data.userId);
      setStep('reset');
      toast.success("Verifikasi berhasil! Silakan buat password baru.");
    } catch (err) {
      console.error("Verify error:", err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
      toast.error("Verifikasi gagal!");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError("Password baru dan konfirmasi tidak cocok");
      toast.error("Password tidak cocok!");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter");
      toast.error("Password terlalu pendek!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Gagal mereset password");
        toast.error("Reset password gagal!");
        return;
      }

      toast.success("Password berhasil direset!");
      
      // Redirect to login
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
      toast.error("Reset password gagal!");
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
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Reset Password</span>
              </div>
            </div>
            <CardTitle className="text-3xl text-center bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              {step === 'verify' ? 'Verifikasi Identitas' : 'Buat Password Baru'}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              {step === 'verify' 
                ? 'Jawab pertanyaan keamanan untuk verifikasi'
                : 'Masukkan password baru Anda'
              }
            </CardDescription>
          </CardHeader>

          {step === 'verify' ? (
            <form onSubmit={handleVerify}>
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
                  <Label htmlFor="securityAnswer">Siapa nama ibu kandung Anda?</Label>
                  <Input
                    id="securityAnswer"
                    type="text"
                    placeholder="Jawaban (huruf kecil, tanpa spasi ekstra)"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    required
                    disabled={loading}
                    className="border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-500">
                    Pertanyaan keamanan diatur saat pendaftaran
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Verifikasi
                    </>
                  )}
                </Button>

                <div className="text-sm text-center space-y-2">
                  <p className="text-gray-600 dark:text-gray-400">
                    Ingat password?{" "}
                    <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                      Login di sini
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
          ) : (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Identitas terverifikasi! Silakan buat password baru.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Ketik ulang password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mereset Password...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Reset Password
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          © 2024 PT Mamagreen Indonesia
        </p>
      </div>
    </div>
  );
}
