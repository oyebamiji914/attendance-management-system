"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getStudentProfile,
  getStudentCourses,
  getStudentAttendance,
  type Course,
  type AttendanceRecord,
} from "@/lib/api";

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<{ matric_number: string; full_name: string; email: string } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      window.location.href = "/login";
      return;
    }

    async function fetchData() {
      try {
        const [profileRes, coursesRes, attendanceRes] = await Promise.all([
          getStudentProfile(),
          getStudentCourses(),
          getStudentAttendance(),
        ]);
        setProfile(profileRes.student);
        setCourses(coursesRes.courses || []);
        setAttendance(attendanceRes.records || []);
      } catch (err) {
        setError("Failed to load dashboard data. Please sign in again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
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
            Student Dashboard
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
        {profile && (
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
              Profile
            </h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{profile.full_name}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Matric number</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{profile.matric_number}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500 dark:text-slate-400">Email</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{profile.email}</dd>
              </div>
            </dl>
          </section>
        )}

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Enrolled Courses
          </h2>
          {courses.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You are not enrolled in any courses yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {courses.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {c.course_code} – {c.course_title}
                    </p>
                    {c.lecturer && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Lecturer: {c.lecturer.full_name}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Attendance History
          </h2>
          {attendance.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No attendance records yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="pb-3 text-left font-medium text-slate-700 dark:text-slate-300">
                      Course
                    </th>
                    <th className="pb-3 text-left font-medium text-slate-700 dark:text-slate-300">
                      Session
                    </th>
                    <th className="pb-3 text-left font-medium text-slate-700 dark:text-slate-300">
                      Status
                    </th>
                    <th className="pb-3 text-left font-medium text-slate-700 dark:text-slate-300">
                      Date & time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      <td className="py-3 text-slate-900 dark:text-white">
                        {r.session?.course?.course_code} – {r.session?.course?.course_title}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">
                        {r.session?.start_time
                          ? formatDate(r.session.start_time)
                          : "—"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.status === "PRESENT"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : r.status === "LATE"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">
                        {formatDate(r.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
