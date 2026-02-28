"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function StudentDashboardPage() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "/login";
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-800 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Student Dashboard</h1>
          <Link
            href="/"
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <p className="text-slate-600 dark:text-slate-400">Welcome! Dashboard content coming soon.</p>
      </main>
    </div>
  );
}
