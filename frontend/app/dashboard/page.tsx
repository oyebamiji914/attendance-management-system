"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getStudentAttendance, getStudentCourses, getStudentProfile } from "@/lib/api/student";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function StudentDashboardPage() {
  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("token") : null), []);

  useEffect(() => {
    if (!token) window.location.href = "/login";
  }, [token]);

  const profileQuery = useQuery({
    queryKey: ["student", "profile"],
    queryFn: getStudentProfile,
    enabled: !!token,
  });

  const coursesQuery = useQuery({
    queryKey: ["student", "courses"],
    queryFn: getStudentCourses,
    enabled: !!token,
  });

  const attendanceQuery = useQuery({
    queryKey: ["student", "attendance"],
    queryFn: getStudentAttendance,
    enabled: !!token,
  });

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const isLoading = profileQuery.isLoading || coursesQuery.isLoading || attendanceQuery.isLoading;
  const error =
    (profileQuery.error as any)?.response?.data?.error ||
    (coursesQuery.error as any)?.response?.data?.error ||
    (attendanceQuery.error as any)?.response?.data?.error ||
    (profileQuery.error || coursesQuery.error || attendanceQuery.error ? "Failed to load dashboard data." : "");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-[hsl(var(--muted-foreground))]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="w-full max-w-lg px-4">
          <Alert variant="destructive">
            <AlertTitle>Unable to load dashboard</AlertTitle>
            <AlertDescription>
              {String(error)}{" "}
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => (window.location.href = "/login")}
              >
                Sign in again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const profile = profileQuery.data?.student ?? null;
  const courses = coursesQuery.data?.courses ?? [];
  const attendance = attendanceQuery.data?.records ?? [];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-800 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Student Dashboard</h1>
          <div className="flex gap-4">
            <Link
              href="/"
              className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
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
        {profile ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[hsl(var(--muted-foreground))]">Name</dt>
                  <dd className="font-medium">{profile.full_name}</dd>
                </div>
                <div>
                  <dt className="text-[hsl(var(--muted-foreground))]">Matric number</dt>
                  <dd className="font-medium">{profile.matric_number}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[hsl(var(--muted-foreground))]">Email</dt>
                  <dd className="font-medium">{profile.email}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enrolled Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">You are not enrolled in any courses yet.</p>
            ) : (
              <ul className="space-y-3">
                {courses.map((c) => (
                  <li key={c.id} className="rounded-lg border border-[hsl(var(--border))] p-4">
                    <p className="font-medium">
                      {c.course_code} – {c.course_title}
                    </p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Lecturer: {c.lecturer?.full_name ?? "—"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No attendance records yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date & time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((r) => {
                      const variant =
                        r.status === "PRESENT" ? "success" : r.status === "LATE" ? "warning" : "muted";
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {r.session?.course?.course_code} – {r.session?.course?.course_title}
                          </TableCell>
                          <TableCell className="text-[hsl(var(--muted-foreground))]">
                            {r.session?.start_time ? formatDate(r.session.start_time) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={variant as any}>{r.status}</Badge>
                          </TableCell>
                          <TableCell className="text-[hsl(var(--muted-foreground))]">
                            {formatDate(r.timestamp)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
