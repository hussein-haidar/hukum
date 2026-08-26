"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const publicPages = ["/admin/login", "/admin/register", "/admin/forgot-password", "/admin/reset-password"];

const menu = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/faq", label: "FAQ Hukum", icon: "❓" },
  { href: "/admin/template", label: "Template Surat", icon: "📝" },
  { href: "/admin/glosarium", label: "Glosarium", icon: "📖" },
  { href: "/admin/sync", label: "Data Sync", icon: "🔄" },
  { href: "/admin/import", label: "Import Data", icon: "📥" },
  { href: "/admin/api-key", label: "API Key", icon: "🔑" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState<{ loading: boolean; ok: boolean; username?: string }>({
    loading: true,
    ok: false,
  });

  const isPublicPage = publicPages.includes(pathname);

  // State for logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (isPublicPage) {
      setAuth({ loading: false, ok: true });
      return;
    }

    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAuth({ loading: false, ok: true, username: data.admin.username });
        } else {
          localStorage.removeItem("admin_token");
          router.replace("/admin/login");
        }
      })
      .catch(() => {
        localStorage.removeItem("admin_token");
        router.replace("/admin/login");
      });
  }, [pathname, router, isPublicPage]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  if (!auth.ok) {
    return null;
  }

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r border-gray-200 p-4 hidden md:block">
        <div className="flex items-center space-x-2 mb-8 px-2">
          <span className="text-xl">⚖️</span>
          <span className="text-lg font-bold text-blue-700">Admin</span>
        </div>
        <nav className="space-y-1">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-8 pt-4 border-t border-gray-200 space-y-1">
          <div className="px-3 py-2 text-xs text-gray-400">
            Masuk sebagai: <span className="font-medium text-gray-600">{auth.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg w-full"
            aria-label="Logout"
          >
            🚪 Logout
          </button>
          {/* Logout Confirmation Modal */}
          {showLogoutModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur z-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-8 w-full max-w-sm shadow-xl">
                <h2 className="text-xl font-bold text-center text-red-600 mb-6">Yakin ingin keluar?</h2>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={cancelLogout}
                    className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm font-medium"
                    >
                    Batal
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="px-6 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                    >
                    Ya, Keluar
                  </button>
                </div>
              </div>
            </div>
          )}
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
            ← Kembali ke Website
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
    </div>
  );
}