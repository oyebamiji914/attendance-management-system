"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  Fingerprint,
} from "lucide-react";

import { getStudentStats, getStudentAttendance } from "@/lib/api/student";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const statCards = [
  { key: "totalCourses", label: "Enrolled Courses", icon: BookOpen },
  { key: "totalAttendance", label: "Attendance Records", icon: ClipboardList },
  { key: "presentCount", label: "Present", icon: CheckCircle2 },
  { key: "lateCount", label: "Late", icon: Clock },
  { key: "absentCount", label: "Absent", icon: XCircle },
  { key: "biometricRegistered", label: "Biometric Registered", icon: Fingerprint },
] as const;

export default function StudentDashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["student", "stats"],
    queryFn: getStudentStats,
  });

  const attendanceQuery = useQuery({
    queryKey: ["student", "attendance"],
    queryFn: getStudentAttendance,
  });

  const isLoading = statsQuery.isLoading || attendanceQuery.isLoading;
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
  const activeSessions = statsQuery.data?.activeSessions ?? [];
  const recentRecords = (attendanceQuery.data?.records ?? []).slice(0, 5);

  return (
    <div className="space-y-6 p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Overview of your courses and attendance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="border-slate-200 bg-white shadow-sm">
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
                      {key === "biometricRegistered"
                        ? stats?.[key]
                          ? "Yes"
                          : "No"
                        : (stats?.[key] ?? 0)}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Live Sessions
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/dashboard/courses">View courses</Link>
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
              No live sessions in your enrolled courses right now.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {activeSessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
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
                  <Badge className="bg-green-500 text-white hover:bg-green-600">Live</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Recent Attendance
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/dashboard/attendance">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentRecords.length === 0 ? (
            <p className="text-sm text-slate-600">No attendance records yet.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {recentRecords.map((record) => (
                <li
                  key={record.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {record.session?.course?.course_code} — {record.session?.course?.course_title}
                    </p>
                    <p className="text-sm text-slate-600">
                      {new Date(record.timestamp).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <Badge
                    className={
                      record.status === "PRESENT"
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : record.status === "LATE"
                          ? "bg-yellow-500 text-white hover:bg-yellow-600"
                          : "bg-red-500 text-white hover:bg-red-600"
                    }
                  >
                    {record.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
