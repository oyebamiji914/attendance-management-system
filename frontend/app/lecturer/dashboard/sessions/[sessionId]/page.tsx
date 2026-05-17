"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserCheck, Users } from "lucide-react";
import { getSessionDetail, markStudentPresent } from "@/lib/api/lecturer";
import { SessionScanButton } from "@/components/lecturer/session-scan-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = Number(params.sessionId);
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [unmarkedFilter, setUnmarkedFilter] = useState("");
  const [scanStatus, setScanStatus] = useState("");

  useEffect(() => {
    if (!scanStatus) return;
    const t = setTimeout(() => setScanStatus(""), 3000);
    return () => clearTimeout(t);
  }, [scanStatus]);

  const detailQuery = useQuery({
    queryKey: ["lecturer", "session", sessionId],
    queryFn: () => getSessionDetail(sessionId),
    enabled: Number.isFinite(sessionId),
  });

  const markMutation = useMutation({
    mutationFn: (studentId: number) => markStudentPresent(sessionId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lecturer", "session", sessionId] });
      qc.invalidateQueries({ queryKey: ["lecturer", "sessions"] });
      qc.invalidateQueries({ queryKey: ["lecturer", "courses"] });
    },
  });

  const session = detailQuery.data?.session;
  const summary = detailQuery.data?.summary;
  const records = session?.records ?? [];
  const unmarkedStudents = detailQuery.data?.unmarked_students ?? [];
  const isLive = session?.end_time === null;

  const filteredMarked = records.filter(
    (r) =>
      r.student.matric_number.toLowerCase().includes(filter.toLowerCase()) ||
      r.student.full_name.toLowerCase().includes(filter.toLowerCase()) ||
      r.student.email.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredUnmarked = unmarkedStudents.filter(
    (s) =>
      s.matric_number.toLowerCase().includes(unmarkedFilter.toLowerCase()) ||
      s.full_name.toLowerCase().includes(unmarkedFilter.toLowerCase()) ||
      s.email.toLowerCase().includes(unmarkedFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 p-5">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link
            href={
              session?.course?.id
                ? `/lecturer/dashboard/sessions?course=${session.course.id}`
                : "/lecturer/dashboard/sessions"
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Link>
        </Button>
      </div>

      {detailQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : detailQuery.isError ? (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="py-10 text-center text-sm text-red-600">
            Failed to load session details.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  Session #{session?.id}
                </h1>
                {isLive ? (
                  <Badge className="bg-green-500 text-white hover:bg-green-600">Live</Badge>
                ) : (
                  <Badge variant="secondary">Ended</Badge>
                )}
              </div>
              {session?.course && (
                <p className="mt-1 text-sm text-slate-600">
                  {session.course.course_code} — {session.course.course_title}
                </p>
              )}
              <p className="mt-2 text-sm text-slate-600">
                Started{" "}
                {session?.start_time
                  ? new Date(session.start_time).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
                {session?.end_time
                  ? ` · Ended ${new Date(session.end_time).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}`
                  : ""}
              </p>
            </div>
            {isLive && (
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <SessionScanButton
                  sessionId={sessionId}
                  onStatusChange={setScanStatus}
                />
                {scanStatus && (
                  <p className="text-sm font-medium text-slate-900">{scanStatus}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Enrolled</p>
                <p className="text-2xl font-bold text-slate-900">
                  {summary?.enrolled_count ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Marked present</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary?.marked_count ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Not marked</p>
                <p className="text-2xl font-bold text-slate-900">
                  {summary?.not_marked_count ?? 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {session?.course?.id && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/lecturer/dashboard/courses/${session.course.id}`}>
                View course attendance
              </Link>
            </Button>
          )}

          {isLive && (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Mark present manually
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Students enrolled but not yet marked for this session
                </p>
                <Input
                  placeholder="Filter by matric, name, or email..."
                  value={unmarkedFilter}
                  onChange={(e) => setUnmarkedFilter(e.target.value)}
                  className="mt-4 max-w-md"
                />
              </CardHeader>
              <CardContent>
                {filteredUnmarked.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    {unmarkedStudents.length === 0
                      ? "Everyone enrolled has been marked present."
                      : "No students match your search."}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Matric Number</TableHead>
                        <TableHead className="font-semibold">Full Name</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="text-right font-semibold">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUnmarked.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium text-slate-900">
                            {student.matric_number}
                          </TableCell>
                          <TableCell className="text-slate-700">{student.full_name}</TableCell>
                          <TableCell className="text-slate-700">{student.email}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={markMutation.isPending}
                              onClick={() => markMutation.mutate(student.id)}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Mark present
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {markMutation.isError && (
                  <p className="mt-3 text-sm text-red-600">
                    {(markMutation.error as { response?: { data?: { error?: string } } })
                      ?.response?.data?.error ?? "Failed to mark student present"}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Marked present
              </CardTitle>
              <Input
                placeholder="Filter by matric, name, or email..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="mt-4 max-w-md"
              />
            </CardHeader>
            <CardContent>
              {filteredMarked.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-slate-100 p-4">
                    <Users className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-slate-900">
                    {records.length === 0
                      ? "No attendance marked yet"
                      : "No students match your search"}
                  </h3>
                  {records.length === 0 && isLive && (
                    <p className="mt-2 text-sm text-slate-500">
                      Scan fingerprint above or mark students present manually.
                    </p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Matric Number</TableHead>
                      <TableHead className="font-semibold">Full Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Time marked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMarked.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium text-slate-900">
                          {record.student.matric_number}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {record.student.full_name}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {record.student.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              record.status === "PRESENT"
                                ? "bg-green-500 text-white hover:bg-green-600"
                                : "bg-red-500 text-white hover:bg-red-600"
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {new Date(record.timestamp).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
