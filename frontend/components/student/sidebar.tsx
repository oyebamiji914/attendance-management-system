"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, ClipboardList, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Sidebar() {
  const pathname = usePathname();
  const [signoutOpen, setSignoutOpen] = useState(false);

  const links = [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/dashboard/courses", label: "Courses", icon: BookOpen },
    { href: "/student/dashboard/attendance", label: "Attendance", icon: ClipboardList },
    { href: "/student/dashboard/profile", label: "Profile", icon: User },
  ];

  function handleSignout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  }

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white shadow-sm">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 bg-slate-900 p-6">
            <h2 className="text-xl font-bold text-white">Student Portal</h2>
            <p className="mt-1 text-xs text-slate-300">Attendance Management</p>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/student/dashboard"
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setSignoutOpen(true)}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <Dialog open={signoutOpen} onOpenChange={setSignoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You will need to log in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignoutOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSignout}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
