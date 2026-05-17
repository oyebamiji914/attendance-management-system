"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen } from "lucide-react";
import { getCourseDetail, getLecturerCourses } from "@/lib/api/lecturer";
import { CourseActions } from "@/components/lecturer/course-actions";
import { RecurringScheduleDialog } from "@/components/lecturer/recurring-schedule-dialog";
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

function attendanceBadgeClass(percentage: number) {
  if (percentage >= 75) return "bg-green-500 text-white hover:bg-green-600";
  if (percentage >= 50) return "bg-yellow-500 text-white hover:bg-yellow-600";
  return "bg-red-500 text-white hover:bg-red-600";
}

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = Number(params.courseId);
  const [filter, setFilter] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["lecturer", "course", courseId],
    queryFn: () => getCourseDetail(courseId),
    enabled: Number.isFinite(courseId),
  });

  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: getLecturerCourses,
    enabled: Number.isFinite(courseId),
  });

  const course = detailQuery.data?.course;
  const students = detailQuery.data?.students ?? [];
  const totalSessions = detailQuery.data?.total_sessions ?? 0;
  const usesRecurring = detailQuery.data?.uses_recurring_schedule ?? false;
  const scheduledCount = detailQuery.data?.scheduled_session_count;

  const courseFromList = coursesQuery.data?.courses.find((c) => c.id === courseId);
  const activeSession = courseFromList?.sessions?.find((s) => s.end_time === null) ?? null;

  const filtered = students.filter(
    (s) =>
      s.matric_number.toLowerCase().includes(filter.toLowerCase()) ||
      s.full_name.toLowerCase().includes(filter.toLowerCase()) ||
      s.email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6 p-5">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/lecturer/dashboard/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
      </div>

      {detailQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : detailQuery.isError ? (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="py-10 text-center text-sm text-red-600">
            Failed to load course details.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {course?.course_code} — {course?.course_title}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {students.length} enrolled student{students.length === 1 ? "" : "s"} ·{" "}
              {totalSessions} session{totalSessions === 1 ? "" : "s"}{" "}
              {usesRecurring ? "scheduled" : "held"}
              {usesRecurring && scheduledCount != null && (
                <span className="text-slate-500">
                  {" "}
                  (from recurring schedule)
                </span>
              )}
            </p>
              {activeSession && (
                <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700" asChild>
                  <Link href={`/lecturer/dashboard/sessions/${activeSession.id}`}>
                    Live session — scan fingerprint
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">
                Course actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CourseActions
                courseId={courseId}
                activeSession={activeSession}
                showDetails={false}
                onScheduleClick={() => setScheduleOpen(true)}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Student attendance
              </CardTitle>
              <p className="text-sm text-slate-600">
                {usesRecurring
                  ? "Percentage = sessions attended ÷ scheduled sessions (from recurring timetable up to today)"
                  : "Percentage = sessions attended ÷ total sessions for this course"}
              </p>
              <Input
                placeholder="Filter by matric, name, or email..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="mt-4 max-w-md"
              />
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-slate-100 p-4">
                    <BookOpen className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-slate-900">
                    {students.length === 0 ? "No students enrolled" : "No students found"}
                  </h3>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Matric Number</TableHead>
                      <TableHead className="font-semibold">Full Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold text-right">Attended</TableHead>
                      <TableHead className="font-semibold text-right">Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium text-slate-900">
                          {student.matric_number}
                        </TableCell>
                        <TableCell className="text-slate-700">{student.full_name}</TableCell>
                        <TableCell className="text-slate-700">{student.email}</TableCell>
                        <TableCell className="text-right text-slate-700">
                          {student.sessions_attended} / {student.total_sessions}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={attendanceBadgeClass(student.attendance_percentage)}>
                            {student.attendance_percentage}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {course && (
            <RecurringScheduleDialog
              courseId={courseId}
              courseCode={course.course_code}
              open={scheduleOpen}
              onOpenChange={setScheduleOpen}
            />
          )}
        </>
      )}
    </div>
  );
}
