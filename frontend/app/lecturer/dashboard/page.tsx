"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getLecturerCourses,
  startAttendanceSession,
  stopAttendanceSession,
  type LecturerCourse,
} from "@/lib/api";

export default function LecturerDashboardPage() {
  const [courses, setCourses] = useState<LecturerCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
    if (!token || role !== "lecturer") {
      window.location.href = "/login";
      return;
    }

    async function fetchCourses() {
      try {
        const res = await getLecturerCourses();
        setCourses(res.courses || []);
      } catch {
        setError("Failed to load courses. Please sign in again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  const hasActiveSession = useMemo(
    () =>
      (course: LecturerCourse) =>
        course.sessions?.some((s) => s.end_time === null),
    [],
  );

  const getActiveSession = useMemo(
    () =>
      (course: LecturerCourse) =>
        course.sessions?.find((s) => s.end_time === null) ?? null,
    [],
  );

  async function handleStart(courseId: number) {
    try {
      setActionId(courseId);
      await startAttendanceSession(courseId);
      const res = await getLecturerCourses();
      setCourses(res.courses || []);
    } catch {
      alert("Failed to start attendance session.");
    } finally {
      setActionId(null);
    }
  }

  async function handleStop(sessionId: number) {
    try {
      setActionId(sessionId);
      await stopAttendanceSession(sessionId);
      const res = await getLecturerCourses();
      setCourses(res.courses || []);
    } catch {
      alert("Failed to stop attendance session.");
    } finally {
      setActionId(null);
    }
  }

  function formatDateTime(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-800 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            Lecturer Dashboard
          </h1>
          <div className="flex gap-4">
            <Link
              href="/"
              className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                window.location.href = "/login";
              }}
              className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Courses and Attendance Sessions
          </h2>
          {courses.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You have not created any courses yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {courses.map((course) => {
                const active = getActiveSession(course);
                return (
                  <li
                    key={course.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {course.course_code} – {course.course_title}
                        </p>
                        {active ? (
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            Active session started at {formatDateTime(active.start_time)}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            No active session
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex gap-2 sm:mt-0">
                        {active ? (
                          <button
                            type="button"
                            disabled={actionId === active.id}
                            onClick={() => handleStop(active.id)}
                            className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-slate-900"
                          >
                            {actionId === active.id ? "Stopping..." : "Stop session"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={actionId === course.id}
                            onClick={() => handleStart(course.id)}
                            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-slate-900"
                          >
                            {actionId === course.id ? "Starting..." : "Start session"}
                          </button>
                        )}
                      </div>
                    </div>

                    {course.sessions && course.sessions.length > 0 && (
                      <div className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">
                        <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">
                          Recent sessions
                        </p>
                        <ul className="space-y-1">
                          {course.sessions.slice(0, 3).map((s) => (
                            <li key={s.id} className="flex justify-between">
                              <span>{formatDateTime(s.start_time)}</span>
                              <span className="text-right">
                                {s.end_time ? `Ended ${formatDateTime(s.end_time)}` : "Active"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
