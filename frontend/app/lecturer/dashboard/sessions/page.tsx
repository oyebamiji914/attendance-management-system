"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  getLecturerCourses,
  getLecturerSessions,
  type SessionAttendanceRecord,
} from "@/lib/api/lecturer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

type LecturerSessionListItem = Awaited<
  ReturnType<typeof getLecturerSessions>
>["sessions"][number];

type AttendanceRow = SessionAttendanceRecord & {
  session_id: number;
  session_start: string;
  session_end: string | null;
  course_code?: string;
};

function SessionsContent() {
  const searchParams = useSearchParams();
  const courseFromQuery = searchParams.get("course") ?? "";
  const [userCourse, setUserCourse] = useState<string | null>(null);
  const selectedCourse = userCourse !== null ? userCourse : courseFromQuery;

  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: getLecturerCourses,
  });

  const sessionsQuery = useQuery({
    queryKey: ["lecturer", "sessions", selectedCourse, page, dateRange],
    queryFn: () =>
      getLecturerSessions(
        page,
        10,
        dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        selectedCourse ? Number(selectedCourse) : undefined
      ),
  });

  const courses = coursesQuery.data?.courses ?? [];
  const courseIdNum = selectedCourse ? Number(selectedCourse) : null;
  const sessions = sessionsQuery.data?.sessions ?? [];

  const allRecords: AttendanceRow[] = sessions.flatMap((session) =>
    (session.records ?? []).map((record) => ({
      ...record,
      session_id: session.id,
      session_start: session.start_time,
      session_end: session.end_time,
      course_code: session.course?.course_code,
    }))
  );

  const filteredRecords = allRecords.filter(
    (record) =>
      record.student?.matric_number?.toLowerCase().includes(filter.toLowerCase()) ||
      record.student?.full_name?.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredSessions = sessions.filter((session: LecturerSessionListItem) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      String(session.id).includes(q) ||
      session.course?.course_code?.toLowerCase().includes(q) ||
      session.course?.course_title?.toLowerCase().includes(q)
    );
  });

  const showAttendanceTable = !!selectedCourse && filteredRecords.length > 0;
  const showSessionList = !showAttendanceTable && filteredSessions.length > 0;

  const selectedCourseData = courses.find((c) => c.id === courseIdNum);
  const pagination = sessionsQuery.data?.pagination;

  function handleCourseChange(value: string) {
    setUserCourse(value === "all" ? "" : value);
    setPage(1);
  }

  function handleDateRangeChange(range: DateRange | undefined) {
    setDateRange(range);
    setPage(1);
  }

  return (
    <div className="space-y-6 p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sessions</h1>
        {selectedCourseData ? (
          <p className="mt-2 text-sm text-slate-600">
            {selectedCourseData.course_code} - {selectedCourseData.course_title}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">All courses</p>
        )}
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">
            {selectedCourse ? "Attendance Records" : "All Sessions"}
          </CardTitle>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row">
            <div className="flex items-center gap-2">
              <Select
                value={selectedCourse || "all"}
                onValueChange={handleCourseChange}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {coursesQuery.isLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    courses.map((course) => (
                      <SelectItem key={course.id} value={String(course.id)}>
                        {course.course_code}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedCourse && (
                <Button variant="ghost" size="sm" onClick={() => handleCourseChange("all")}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <DatePickerWithRange date={dateRange} setDate={handleDateRangeChange} />

            <Input
              placeholder={
                selectedCourse
                  ? "Filter by matric number or name..."
                  : "Filter by course, session #..."
              }
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardHeader>
        <CardContent>
          {sessionsQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <CalendarIcon className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-slate-900">No sessions found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try adjusting your date range, or start a session from Courses
              </p>
            </div>
          ) : showSessionList ? (
            <div className="space-y-6">
              {!selectedCourse && filteredSessions.length < sessions.length && filter && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-700">
                    Showing {filteredSessions.length} of {sessions.length} sessions on this page
                  </p>
                </div>
              )}
              {selectedCourse && filteredRecords.length === 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-700">
                    {sessions.length} session{sessions.length === 1 ? "" : "s"} found
                    {filter
                      ? " but none match your search"
                      : " but no attendance has been marked yet"}
                    . Open a live session to scan fingerprint or mark students present.
                  </p>
                </div>
              )}
              <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                {filteredSessions.map((session) => (
                  <li
                    key={session.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {!selectedCourse && session.course && (
                          <span className="text-slate-600">{session.course.course_code} · </span>
                        )}
                        Session #{session.id}
                      </p>
                      <p className="text-sm text-slate-600">
                        {new Date(session.start_time).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {session.end_time
                          ? ` — ended ${new Date(session.end_time).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}`
                          : ""}
                        {!selectedCourse && session.course && (
                          <span className="block text-slate-500">{session.course.course_title}</span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {(session.records?.length ?? 0)} marked present
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {session.end_time === null ? (
                        <Badge className="bg-green-500 text-white hover:bg-green-600">Live</Badge>
                      ) : (
                        <Badge variant="secondary">Ended</Badge>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/lecturer/dashboard/sessions/${session.id}`}>
                          {session.end_time === null ? "Scan fingerprint" : "View"}
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          ) : showAttendanceTable ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Matric Number</TableHead>
                    <TableHead className="font-semibold">Student Name</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Session</TableHead>
                    <TableHead className="font-semibold">Time Marked</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium text-slate-900">
                        {record.student?.matric_number}
                      </TableCell>
                      <TableCell className="text-slate-700">{record.student?.full_name}</TableCell>
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
                        <Link
                          href={`/lecturer/dashboard/sessions/${record.session_id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          #{record.session_id} ·{" "}
                          {new Date(record.session_start).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {new Date(record.timestamp).toLocaleTimeString(undefined, {
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/lecturer/dashboard/sessions/${record.session_id}`}>
                            View session
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <h3 className="text-lg font-medium text-slate-900">No sessions match your search</h3>
              <p className="mt-2 text-sm text-slate-500">Try a different filter or date range</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SessionsFallback() {
  return (
    <div className="space-y-6 p-5">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={<SessionsFallback />}>
      <SessionsContent />
    </Suspense>
  );
}
