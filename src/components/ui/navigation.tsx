"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogOut, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  
  const userRole = (session?.user as any)?.role || "user";
  const isAuthenticated = !!session?.user;

  // Dynamic nav items based on role
  const getNavItems = () => {
    const baseItems = [{ href: "/", label: "Home" }];
    
    if (!isAuthenticated) {
      return baseItems;
    }

    if (userRole === "admin" || userRole === "teknisi") {
      return [
        ...baseItems,
        { href: "/dashboard", label: "Dashboard" },
        { href: "/tickets", label: "Tickets" },
        { href: "/projects", label: "Projects" },
        { href: "/pm/dashboard", label: "PM Dashboard" },
        { href: "/reports", label: "Reports" },
        { href: "/knowledge-base", label: "Knowledge Base" },
      ];
    }

    // User role - only tickets
    return [
      ...baseItems,
      { href: "/tickets", label: "Buat Tiket" },
    ];
  };

  const navItems = getNavItems();

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token");
    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    if (error?.code) {
      toast.error("Gagal logout");
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      router.push("/");
      toast.success("Logout berhasil");
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-emerald-200/50 dark:border-emerald-800/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-1">
            <Link 
              href="/" 
              className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hover:from-emerald-700 hover:to-teal-700 transition-all"
            >
              IT Mamagreen
            </Link>
          </div>
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  pathname === item.href || (item.href === "/pm/dashboard" && pathname?.startsWith("/pm"))
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30"
                    : "text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {isPending ? (
              <div className="ml-2 px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              </div>
            ) : isAuthenticated ? (
              <div className="ml-2 flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {session.user.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-sm">
                    {userRole}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="gap-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="ml-2 flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-400">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/30">
                    Daftar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}