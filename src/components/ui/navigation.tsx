"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Ticket, FileText, BookOpen, Menu, X, LogOut, User, Shield, UserCircle, ChevronDown, FolderKanban } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    checkSession();
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Logout berhasil!");
        setUser(null);
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      toast.error("Gagal logout");
    }
  };

  // Navigation items based on role
  const getNavItems = () => {
    const baseItems = [
      { href: "/", label: "Home", icon: null, public: true },
    ];

    if (!user) {
      // Non-authenticated users only see Home
      return baseItems;
    }

    // Authenticated users - add Tickets
    const authItems = [
      { href: "/tickets", label: "Tickets", icon: Ticket, public: false },
    ];

    // Superadmin and Teknisi - add Projects, Knowledge Base, and Reports
    if (user.role === "superadmin" || user.role === "teknisi") {
      authItems.push({ href: "/projects", label: "Projects", icon: FolderKanban, public: false });
      authItems.push({ href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen, public: false });
      authItems.push({ href: "/reports", label: "Reports", icon: FileText, public: false });
    }

    return [...baseItems, ...authItems];
  };

  const navItems = getNavItems();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-emerald-200/50 dark:border-emerald-800/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link 
              href="/" 
              className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hover:from-emerald-700 hover:to-teal-700 transition-all"
            >
              IT Helpdesk Mamagreen
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    pathname === item.href
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30"
                      : "text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              );
            })}

            {/* User Info & Logout */}
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2 ml-4 pl-4 border-l border-emerald-200 dark:border-emerald-800">
                    {/* User Dropdown */}
                    <div className="relative" ref={userMenuRef}>
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                      >
                        {user.role === 'superadmin' ? (
                          <Shield className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <User className="h-4 w-4 text-emerald-600" />
                        )}
                        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                          {user.name}
                        </span>
                        {user.role === 'superadmin' && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-600 text-white rounded">
                            Admin
                          </span>
                        )}
                        {user.role === 'teknisi' && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded">
                            Teknisi
                          </span>
                        )}
                        <ChevronDown className={`h-4 w-4 text-emerald-600 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {userMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-emerald-200 dark:border-emerald-800 py-1 z-50">
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                          >
                            <UserCircle className="h-4 w-4" />
                            Profile
                          </Link>
                          <hr className="my-1 border-emerald-200 dark:border-emerald-800" />
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 ml-4 pl-4 border-l border-emerald-200 dark:border-emerald-800">
                    <Link href="/login">
                      <Button size="sm" variant="ghost">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                        Register
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-950"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
                    pathname === item.href
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                  }`}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile User Info & Actions */}
            {!loading && (
              <>
                {user ? (
                  <>
                    <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {user.role === 'superadmin' ? (
                          <Shield className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <User className="h-5 w-5 text-emerald-600" />
                        )}
                        <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                          {user.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
                      {user.role === 'superadmin' && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-emerald-600 text-white rounded">
                          Super Admin
                        </span>
                      )}
                      {user.role === 'teknisi' && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded">
                          Teknisi
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600">
                        Register
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}