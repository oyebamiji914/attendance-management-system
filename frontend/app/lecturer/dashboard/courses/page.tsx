"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, BookOpen } from "lucide-react";
import Link from "next/link";
import { RecurringScheduleDialog } from "@/components/lecturer/recurring-schedule-dialog";
import { CourseActions } from "@/components/lecturer/course-actions";
import { getLecturerCourses, createCourse } from "@/lib/api/lecturer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [filter, setFilter] = useState("");
  const [scheduleCourse, setScheduleCourse] = useState<{
    id: number;
    course_code: string;
  } | null>(null);

  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: getLecturerCourses,
  });

  const createMutation = useMutation({
    mutationFn: () => createCourse(courseCode, courseTitle),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lecturer", "courses"] });
      setCreateOpen(false);
      setCourseCode("");
      setCourseTitle("");
    },
  });

  const courses = coursesQuery.data?.courses ?? [];
  const filtered = courses.filter(
    (c) =>
      c.course_code.toLowerCase().includes(filter.toLowerCase()) ||
      c.course_title.toLowerCase().includes(filter.toLowerCase())
  );

  const getActiveSession = (course: (typeof courses)[0]) =>
    course.sessions?.find((s) => s.end_time === null) ?? null;

  return (
    <div className="space-y-6 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
          <p className="mt-2 text-slate-600">Manage your courses and sessions</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">Course Code</Label>
                <Input
                  id="code"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CS101"
                />
              </div>
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Introduction to Programming"
                />
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!courseCode || !courseTitle || createMutation.isPending}
                className="w-full bg-slate-900 hover:bg-slate-800"
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
              {createMutation.isError && (
                <p className="text-sm text-red-600">
                  {(createMutation.error as { response?: { data?: { error?: string } } })?.response
                    ?.data?.error || "Failed to create course"}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">All Courses</CardTitle>
          <Input
            placeholder="Filter by course code or title..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-4"
          />
        </CardHeader>
        <CardContent>
          {coursesQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <BookOpen className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-slate-900">
                {courses.length === 0 ? "No courses yet" : "No courses found"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {courses.length === 0
                  ? "Get started by creating your first course"
                  : "Try adjusting your search filter"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Course Code</TableHead>
                  <TableHead className="font-semibold">Course Title</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Sessions</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((course) => {
                  const active = getActiveSession(course);
                  return (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium text-slate-900">
                        <Link
                          href={`/lecturer/dashboard/courses/${course.id}`}
                          className="text-slate-900 underline-offset-4 hover:underline"
                        >
                          {course.course_code}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-700">{course.course_title}</TableCell>
                      <TableCell>
                        {active ? (
                          <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {course.sessions?.length || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <CourseActions
                          courseId={course.id}
                          activeSession={active}
                          onScheduleClick={() =>
                            setScheduleCourse({ id: course.id, course_code: course.course_code })
                          }
                          className="justify-end"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {scheduleCourse && (
        <RecurringScheduleDialog
          courseId={scheduleCourse.id}
          courseCode={scheduleCourse.course_code}
          open={!!scheduleCourse}
          onOpenChange={(open) => !open && setScheduleCourse(null)}
        />
      )}
    </div>
  );
}
