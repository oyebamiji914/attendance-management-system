"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon } from "lucide-react";
import { getStudentAttendance } from "@/lib/api/student";
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

function statusBadgeClass(status: string) {
  if (status === "PRESENT") return "bg-green-500 text-white hover:bg-green-600";
  if (status === "LATE") return "bg-yellow-500 text-white hover:bg-yellow-600";
  return "bg-red-500 text-white hover:bg-red-600";
}

export default function StudentAttendancePage() {
  const [filter, setFilter] = useState("");

  const attendanceQuery = useQuery({
    queryKey: ["student", "attendance"],
    queryFn: getStudentAttendance,
  });

  const records = attendanceQuery.data?.records ?? [];
  const filtered = records.filter((r) => {
    const q = filter.toLowerCase();
    return (
      r.session?.course?.course_code?.toLowerCase().includes(q) ||
      r.session?.course?.course_title?.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="mt-2 text-slate-600">Your full attendance history</p>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            Attendance Records
          </CardTitle>
          <Input
            placeholder="Filter by course or status..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-4"
          />
        </CardHeader>
        <CardContent>
          {attendanceQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <CalendarIcon className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-slate-900">
                {records.length === 0 ? "No attendance records" : "No records found"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {records.length === 0
                  ? "Your attendance will appear here after sessions"
                  : "Try adjusting your filter"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Course</TableHead>
                  <TableHead className="font-semibold">Session</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Marked At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium text-slate-900">
                      {record.session?.course?.course_code} —{" "}
                      {record.session?.course?.course_title}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {record.session?.start_time
                        ? new Date(record.session.start_time).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(record.status)}>
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
    </div>
  );
}
