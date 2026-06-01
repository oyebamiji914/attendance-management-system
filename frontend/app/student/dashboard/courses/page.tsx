"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus } from "lucide-react";
import {
  enrollInCourse,
  getAllCourses,
  getStudentCourses,
} from "@/lib/api/student";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentCoursesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [enrollCourseId, setEnrollCourseId] = useState("");

  const enrolledQuery = useQuery({
    queryKey: ["student", "courses"],
    queryFn: getStudentCourses,
  });

  const allCoursesQuery = useQuery({
    queryKey: ["courses", "all"],
    queryFn: getAllCourses,
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: number) => enrollInCourse(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", "courses"] });
      qc.invalidateQueries({ queryKey: ["student", "stats"] });
      setEnrollCourseId("");
    },
  });

  const enrolled = useMemo(
    () => enrolledQuery.data?.courses ?? [],
    [enrolledQuery.data]
  );

  const available = useMemo(() => {
    const enrolledIds = new Set(enrolled.map((c) => c.id));
    const all = allCoursesQuery.data?.courses ?? [];
    return all.filter((c) => !enrolledIds.has(c.id));
  }, [allCoursesQuery.data, enrolled]);

  const filtered = enrolled.filter(
    (c) =>
      c.course_code.toLowerCase().includes(filter.toLowerCase()) ||
      c.course_title.toLowerCase().includes(filter.toLowerCase())
  );

  const isLoading = enrolledQuery.isLoading;

  return (
    <div className="space-y-6 p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
        <p className="mt-2 text-slate-600">View enrolled courses and join new ones</p>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Enroll in a Course</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={enrollCourseId} onValueChange={setEnrollCourseId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a course to enroll" />
              </SelectTrigger>
              <SelectContent>
                {allCoursesQuery.isLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : available.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No courses available
                  </SelectItem>
                ) : (
                  available.map((course: { id: number; course_code: string; course_title: string }) => (
                    <SelectItem key={course.id} value={String(course.id)}>
                      {course.course_code} — {course.course_title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              className="bg-slate-900 hover:bg-slate-800"
              disabled={!enrollCourseId || enrollMutation.isPending}
              onClick={() => enrollMutation.mutate(Number(enrollCourseId))}
            >
              <Plus className="mr-2 h-4 w-4" />
              {enrollMutation.isPending ? "Enrolling..." : "Enroll"}
            </Button>
          </div>
          {enrollMutation.isError && (
            <p className="mt-2 text-sm text-red-600">
              {(enrollMutation.error as { response?: { data?: { error?: string } } })?.response
                ?.data?.error ?? "Failed to enroll"}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">My Courses</CardTitle>
          <Input
            placeholder="Filter by course code or title..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-4"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <BookOpen className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-slate-900">
                {enrolled.length === 0 ? "No courses yet" : "No courses found"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {enrolled.length === 0
                  ? "Enroll in a course using the form above"
                  : "Try adjusting your search filter"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Course Code</TableHead>
                  <TableHead className="font-semibold">Course Title</TableHead>
                  <TableHead className="font-semibold">Lecturer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium text-slate-900">
                      {course.course_code}
                    </TableCell>
                    <TableCell className="text-slate-700">{course.course_title}</TableCell>
                    <TableCell className="text-slate-700">
                      {course.lecturer?.full_name ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
