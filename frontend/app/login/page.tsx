"use client";

import { useState } from "react";
import Link from "next/link";
import { loginStudent, loginLecturer, type Role } from "@/lib/api";

export default function LoginPage() {
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res =
        role === "student"
          ? await loginStudent(email, password)
          : await loginLecturer(email, password);
      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("role", role);
        window.location.href = role === "student" ? "/dashboard" : "/lecturer/dashboard";
      }
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : "Login failed";
      setError(msg || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Biometric Attendance System
            </p>
          </div>

          {/* Role tabs */}
          <div className="mb-6 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-700">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                role === "student"
                  ? "bg-white text-slate-900 shadow dark:bg-slate-600 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole("lecturer")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                role === "lecturer"
                  ? "bg-white text-slate-900 shadow dark:bg-slate-600 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Lecturer
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 sm:text-sm"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-slate-800"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Sign up
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
