"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getLecturerCourses, startAttendanceSession, stopAttendanceSession } from "@/lib/api/lecturer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LecturerDashboardPage() {
  const qc = useQueryClient();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
    if (!token || role !== "lecturer") window.location.href = "/login";
  }, []);

  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: getLecturerCourses,
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const startMutation = useMutation({
    mutationFn: (courseId: number) => startAttendanceSession(courseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lecturer", "courses"] }),
  });

  const stopMutation = useMutation({
    mutationFn: (sessionId: number) => stopAttendanceSession(sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lecturer", "courses"] }),
  });

  const courses = coursesQuery.data?.courses ?? [];

  const getActiveSession = useMemo(
    () =>
      (course: { sessions: { id: number; start_time: string; end_time: string | null }[] }) =>
        course.sessions?.find((s) => s.end_time === null) ?? null,
    []
  );

  function formatDateTime(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  if (coursesQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-[hsl(var(--muted-foreground))]">Loading...</div>
      </div>
    );
  }

  if (coursesQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="w-full max-w-lg px-4">
          <Alert variant="destructive">
            <AlertTitle>Unable to load courses</AlertTitle>
            <AlertDescription>
              {(coursesQuery.error as any)?.response?.data?.error ?? "Please sign in again."}
              <div className="mt-3">
                <Button variant="outline" onClick={() => (window.location.href = "/login")}>
                  Sign in
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const busy = startMutation.isPending || stopMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-800 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Lecturer Dashboard</h1>
          <div className="flex gap-4">
            <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Home
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                window.location.href = "/login";
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Courses and Attendance Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">You have not created any courses yet.</p>
            ) : (
              <ul className="space-y-4">
                {courses.map((course) => {
                  const active = getActiveSession(course);
                  return (
                    <li key={course.id} className="rounded-lg border border-[hsl(var(--border))] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">
                            {course.course_code} – {course.course_title}
                          </p>
                          {active ? (
                            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                              Active session started at {formatDateTime(active.start_time)}{" "}
                              <Badge variant="success" className="ml-2">
                                Active
                              </Badge>
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">No active session</p>
                          )}
                        </div>

                        {active ? (
                          <Button
                            variant="destructive"
                            disabled={busy}
                            onClick={() => stopMutation.mutate(active.id)}
                          >
                            {stopMutation.isPending ? "Stopping..." : "Stop session"}
                          </Button>
                        ) : (
                          <Button disabled={busy} onClick={() => startMutation.mutate(course.id)}>
                            {startMutation.isPending ? "Starting..." : "Start session"}
                          </Button>
                        )}
                      </div>

                      {course.sessions?.length ? (
                        <div className="mt-4 border-t border-[hsl(var(--border))] pt-4">
                          <p className="mb-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">Recent sessions</p>
                          <ul className="space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                            {course.sessions.slice(0, 3).map((s) => (
                              <li key={s.id} className="flex justify-between">
                                <span>{formatDateTime(s.start_time)}</span>
                                <span>{s.end_time ? `Ended ${formatDateTime(s.end_time)}` : "Active"}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
