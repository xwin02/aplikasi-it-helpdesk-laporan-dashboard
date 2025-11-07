"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, Ticket, TrendingUp, Clock, Shield, BookOpen, LogIn, UserPlus, Sparkles } from "lucide-react";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = useSession();
  const userRole = (session?.user as any)?.role || "user";
  const isAuthenticated = !!session?.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
      {/* Hero Section with Modern Design */}
      <div className="relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-green-300/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg ring-2 ring-emerald-200 dark:ring-emerald-800">
                <Image 
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/logommg-1761793499870.png"
                  alt="PT Mamagreen Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Modern IT Support Platform</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
              IT Helpdesk System
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Platform manajemen ticket support yang efisien untuk mengelola permintaan IT dan memberikan solusi cepat dengan sistem yang modern dan intuitif
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {isAuthenticated ? (
                <>
                  {(userRole === "admin" || userRole === "teknisi") && (
                    <Link href="/dashboard">
                      <Button size="lg" className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105">
                        <BarChart3 className="h-5 w-5" />
                        Lihat Dashboard
                      </Button>
                    </Link>
                  )}
                  <Link href="/tickets">
                    <Button size="lg" variant="outline" className="gap-2 border-2 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950 transition-all hover:scale-105">
                      <Ticket className="h-5 w-5" />
                      {userRole === "user" ? "Buat Tiket" : "Kelola Tiket"}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button size="lg" className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105">
                      <LogIn className="h-5 w-5" />
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="lg" variant="outline" className="gap-2 border-2 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950 transition-all hover:scale-105">
                      <UserPlus className="h-5 w-5" />
                      Daftar Akun
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Feature Cards with Modern Design */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-20">
            <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-3 shadow-lg">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-emerald-900 dark:text-emerald-100">Dashboard Interaktif</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Visualisasi data real-time dengan chart dan statistik lengkap untuk monitoring performa support
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated && (userRole === "admin" || userRole === "teknisi") ? (
                  <Link href="/dashboard">
                    <Button variant="link" className="p-0 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">
                      Buka Dashboard →
                    </Button>
                  </Link>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-500">Login sebagai Admin/Teknisi untuk akses</p>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-teal-200 dark:border-teal-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-3 shadow-lg">
                  <Ticket className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-teal-900 dark:text-teal-100">Manajemen Tiket</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Kelola semua tiket support dengan filter berdasarkan status, prioritas, dan kategori
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <Link href="/tickets">
                    <Button variant="link" className="p-0 text-teal-600 dark:text-teal-400 hover:text-teal-700">
                      {userRole === "user" ? "Buat Tiket" : "Kelola Tiket"} →
                    </Button>
                  </Link>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-500">Login untuk membuat tiket</p>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-green-200 dark:border-green-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-3 shadow-lg">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-green-900 dark:text-green-100">Laporan & Analytics</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Analisis mendalam dengan laporan bulanan dan export data untuk evaluasi performa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated && (userRole === "admin" || userRole === "teknisi") ? (
                  <Link href="/reports">
                    <Button variant="link" className="p-0 text-green-600 dark:text-green-400 hover:text-green-700">
                      Lihat Laporan →
                    </Button>
                  </Link>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-500">Login sebagai Admin/Teknisi untuk akses</p>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-105 border-cyan-200 dark:border-cyan-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center mb-3 shadow-lg">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-cyan-900 dark:text-cyan-100">Knowledge Base</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Akses artikel panduan dan solusi umum untuk mengatasi masalah IT secara mandiri
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated && (userRole === "admin" || userRole === "teknisi") ? (
                  <Link href="/knowledge-base">
                    <Button variant="link" className="p-0 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700">
                      Buka Knowledge Base →
                    </Button>
                  </Link>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-500">Login sebagai Admin/Teknisi untuk akses</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Features Section with Colorful Design */}
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-3xl p-10 mb-20 shadow-xl border border-emerald-200 dark:border-emerald-800">
            <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              Fitur Unggulan
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center group">
                <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-10 w-10 text-emerald-600 dark:text-emerald-300" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">Filter Bulanan</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Filter data berdasarkan bulan dan tahun untuk analisis spesifik
                </p>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900 dark:to-teal-800 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Shield className="h-10 w-10 text-teal-600 dark:text-teal-300" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">Multi Kategori</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kategorisasi tiket: Hardware, Software, Network, Access, dan lainnya
                </p>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="h-10 w-10 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">Tracking Waktu</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor waktu penyelesaian tiket dan rata-rata resolution time
                </p>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900 dark:to-cyan-800 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="h-10 w-10 text-cyan-600 dark:text-cyan-300" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">Export Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Export laporan ke format CSV untuk analisis lebih lanjut
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section with Modern Gradient */}
          <div className="text-center bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-4xl font-bold mb-4 text-white">Siap untuk Memulai?</h2>
            <p className="text-emerald-50 mb-8 text-lg">
              Kelola tiket support Anda dengan lebih efisien hari ini
            </p>
            {isAuthenticated ? (
              <Link href="/tickets">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  {userRole === "user" ? "Buat Tiket Baru" : "Kelola Tiket"}
                </Button>
              </Link>
            ) : (
              <div className="flex gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 transition-all hover:scale-105">
                    Daftar Akun
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}