"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Users,
  ClipboardList,
  Radio,
  CheckCircle2,
  Fingerprint,
} from "lucide-react";

import { getLecturerCourses, getLecturerStats, scanFingerprint } from "@/lib/api/lecturer";
import { captureFingerprint } from "@/lib/biometric-scanner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const statCards = [
  { key: "totalCourses", label: "Courses", icon: BookOpen },
  { key: "totalStudents", label: "Students", icon: Users },
  { key: "totalSessions", label: "Sessions", icon: ClipboardList },
  { key: "activeSessions", label: "Active Sessions", icon: Radio },
  { key: "attendanceMarked", label: "Attendance Marked", icon: CheckCircle2 },
  { key: "studentsWithBiometric", label: "Biometric Registered", icon: Fingerprint },
] as const;

export default function LecturerDashboardPage() {
  const qc = useQueryClient();
  const [scanStatus, setScanStatus] = useState("");
  const [scanningSessionId, setScanningSessionId] = useState<number | null>(null);

  const statsQuery = useQuery({
    queryKey: ["lecturer", "stats"],
    queryFn: getLecturerStats,
  });

  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: getLecturerCourses,
  });

  const scanMutation = useMutation({
    mutationFn: ({ sessionId, template }: { sessionId: number; template: string }) =>
      scanFingerprint(sessionId, template),
    onSuccess: (data) => {
      setScanStatus(`✓ ${data.student?.full_name} marked present`);
      qc.invalidateQueries({ queryKey: ["lecturer", "stats"] });
      qc.invalidateQueries({ queryKey: ["lecturer", "attendance"] });
      setTimeout(() => setScanStatus(""), 3000);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setScanStatus(`✗ ${err?.response?.data?.error || "No match found"}`);
      setTimeout(() => setScanStatus(""), 3000);
    },
    onSettled: () => setScanningSessionId(null),
  });

  async function handleScan(sessionId: number) {
    setScanningSessionId(sessionId);
    setScanStatus("Place finger on scanner...");
    try {
      const result = await captureFingerprint();
      setScanStatus("Matching fingerprint...");
      await scanMutation.mutateAsync({ sessionId, template: result.template });
    } catch {
      setScanStatus("✗ Scanner error");
      setScanningSessionId(null);
      setTimeout(() => setScanStatus(""), 3000);
    }
  }

  const activeSessions = useMemo(() => {
    const courses = coursesQuery.data?.courses ?? [];
    return courses.flatMap((course) =>
      (course.sessions ?? [])
        .filter((s) => s.end_time === null)
        .map((session) => ({
          ...session,
          course_code: course.course_code,
          course_title: course.course_title,
        }))
    );
  }, [coursesQuery.data]);

  const isLoading = statsQuery.isLoading || coursesQuery.isLoading;
  const isError = statsQuery.isError;

  if (isError) {
    return (
      <div className="p-5">
        <Alert variant="destructive">
          <AlertTitle>Unable to load dashboard</AlertTitle>
          <AlertDescription>
            {(statsQuery.error as { response?: { data?: { error?: string } } })?.response?.data
              ?.error ?? "Please sign in again."}
            <div className="mt-3">
              <Button variant="outline" onClick={() => (window.location.href = "/login")}>
                Sign in
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = statsQuery.data?.stats;

  return (
    <div className="space-y-6 p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Overview of your courses, students, and attendance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ key, label, icon: Icon }) => (
          <Card
            key={key}
            className="border-slate-200 bg-white shadow-sm"
          >
            <CardContent className="flex items-center gap-4 p-5">
              {isLoading ? (
                <>
                  <Skeleton className="h-11 w-11 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">{label}</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {stats?.[key] ?? 0}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {scanStatus && (
        <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-slate-50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-slate-900">{scanStatus}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Active Sessions
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/lecturer/dashboard/sessions">View all sessions</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : activeSessions.length === 0 ? (
            <p className="text-sm text-slate-600">
              No active sessions. Start one from the{" "}
              <Link
                href="/lecturer/dashboard/courses"
                className="font-medium text-slate-900 underline"
              >
                Courses
              </Link>{" "}
              page.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {activeSessions.map((session) => (
                <li
                  key={session.id}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {session.course_code} — {session.course_title}
                    </p>
                    <p className="text-sm text-slate-600">
                      Started{" "}
                      {new Date(session.start_time).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500 text-white hover:bg-green-600">Live</Badge>
                    <Button
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800"
                      disabled={scanMutation.isPending}
                      onClick={() => handleScan(session.id)}
                    >
                      <Fingerprint className="mr-2 h-4 w-4" />
                      {scanningSessionId === session.id && scanMutation.isPending
                        ? "Scanning..."
                        : "Scan Fingerprint"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
