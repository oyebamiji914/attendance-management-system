import { api, authHeaders } from "./client";

export interface Course {
  id: number;
  course_code: string;
  course_title: string;
  lecturer_id: number;
  lecturer: { full_name: string; email: string };
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  timestamp: string;
  status: string;
  session: {
    id: number;
    start_time: string;
    end_time: string | null;
    course: { id: number; course_code: string; course_title: string };
  };
}

export async function getStudentCourses(): Promise<{ courses: Course[] }> {
  const { data } = await api.get<{ courses: Course[] }>("/api/students/courses", {
    headers: authHeaders(),
  });
  return data;
}

export async function getStudentAttendance(): Promise<{ records: AttendanceRecord[] }> {
  const { data } = await api.get<{ records: AttendanceRecord[] }>("/api/students/attendance", {
    headers: authHeaders(),
  });
  return data;
}

export async function getStudentProfile(): Promise<{
  student: { id: number; matric_number: string; full_name: string; email: string };
}> {
  const { data } = await api.get("/api/students/me", { headers: authHeaders() });
  return data;
}

