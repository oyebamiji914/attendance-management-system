"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/student/sidebar";

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
    if (!token || role !== "student") window.location.href = "/login";
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen overflow-auto">{children}</main>
    </div>
  );
}
