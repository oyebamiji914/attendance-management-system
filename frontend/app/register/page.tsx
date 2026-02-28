"use client";

import { useState } from "react";
import Link from "next/link";
import { registerStudent, registerLecturer, type Role } from "@/lib/api";

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [staffId, setStaffId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res =
        role === "student"
          ? await registerStudent({ matric_number: matricNumber, full_name: fullName, email, password })
          : await registerLecturer({ staff_id: staffId, full_name: fullName, email, password });
      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("role", role);
        window.location.href = role === "student" ? "/dashboard" : "/lecturer/dashboard";
      }
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : "Registration failed";
      setError(msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 sm:text-sm";
  const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Create account
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
            {role === "student" && (
              <div>
                <label htmlFor="matric" className={labelCls}>
                  Matric number
                </label>
                <input
                  id="matric"
                  type="text"
                  required
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 20/ABC/001"
                />
              </div>
            )}
            {role === "lecturer" && (
              <div>
                <label htmlFor="staff" className={labelCls}>
                  Staff ID
                </label>
                <input
                  id="staff"
                  type="text"
                  required
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. LEC001"
                />
              </div>
            )}
            <div>
              <label htmlFor="fullName" className={labelCls}>
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputCls}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email" className={labelCls}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className={labelCls}>
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
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
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Sign in
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
