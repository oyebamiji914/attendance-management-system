"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users as UsersIcon, X } from "lucide-react";
import { getLecturerCourses } from "@/lib/api/lecturer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type StudentCourse = {
  id: number;
  code: string;
  title: string;
};

type EnrolledStudent = {
  id: number;
  matric_number: string;
  full_name: string;
  email: string;
  biometric_template?: string | null;
  courses: StudentCourse[];
};

export default function StudentsPage() {
  const [filter, setFilter] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: getLecturerCourses,
  });

  const courses = coursesQuery.data?.courses ?? [];

  const allStudents = courses.flatMap((course) =>
    (course.enrollments ?? []).map((enrollment) => ({
      ...enrollment.student,
      course_code: course.course_code,
      course_title: course.course_title,
      course_id: course.id,
    }))
  );

  const uniqueStudentsMap = new Map<number, EnrolledStudent>();
  allStudents.forEach((student) => {
    const key = student.id;
    if (!uniqueStudentsMap.has(key)) {
      uniqueStudentsMap.set(key, {
        id: student.id,
        matric_number: student.matric_number,
        full_name: student.full_name,
        email: student.email,
        biometric_template: student.biometric_template,
        courses: [],
      });
    }
    uniqueStudentsMap.get(key)!.courses.push({
      id: student.course_id,
      code: student.course_code,
      title: student.course_title,
    });
  });

  let students = Array.from(uniqueStudentsMap.values());

  if (selectedCourse !== "all") {
    students = students.filter((s) =>
      s.courses.some((c) => c.id === Number(selectedCourse))
    );
  }

  const filtered = students.filter(
    (s) =>
      s.matric_number?.toLowerCase().includes(filter.toLowerCase()) ||
      s.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
      s.email?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6 p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Students</h1>
        <p className="text-slate-600 mt-2">View all enrolled students</p>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Enrolled Students</CardTitle>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row">
            <div className="flex items-center gap-2">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {coursesQuery.isLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    courses.map((course) => (
                      <SelectItem key={course.id} value={String(course.id)}>
                        {course.course_code}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedCourse !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCourse("all")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Input
              placeholder="Filter by matric number, name, or email..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1"
            />
          </div>
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
                <UsersIcon className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-slate-900">
                {students.length === 0 ? "No students enrolled" : "No students found"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {students.length === 0 
                  ? "Students will appear here once they enroll in your courses" 
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Matric Number</TableHead>
                  <TableHead className="font-semibold">Full Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Biometric</TableHead>
                  <TableHead className="font-semibold">Enrolled Courses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium text-slate-900">
                      {student.matric_number}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {student.full_name}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {student.email}
                    </TableCell>
                    <TableCell>
                      {student.biometric_template ? (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white">Registered</Badge>
                      ) : (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.courses.map((course) => (
                          <Badge key={course.id} variant="outline" className="border-slate-300 text-slate-700">
                            {course.code}
                          </Badge>
                        ))}
                      </div>
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
