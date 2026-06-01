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

export interface StudentStats {
  totalCourses: number;
  totalAttendance: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  biometricRegistered: number;
}

export interface StudentActiveSession {
  id: number;
  start_time: string;
  course_code: string;
  course_title: string;
}

export async function getStudentStats(): Promise<{
  stats: StudentStats;
  activeSessions: StudentActiveSession[];
}> {
  const { data } = await api.get<{
    stats: StudentStats;
    activeSessions: StudentActiveSession[];
  }>("/api/students/stats", { headers: authHeaders() });
  return data;
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

export async function registerBiometric(template: string): Promise<{ message: string }> {
  const { data } = await api.post(
    "/api/students/biometric",
    { template },
    { headers: authHeaders() }
  );
  return data;
}

export async function getAllCourses(): Promise<{ courses: Course[] }> {
  const { data } = await api.get<{ courses: Course[] }>("/api/courses");
  return data;
}

export interface Enrollment {
  id: number;
  course_id: number;
  student_id: number;
}

export async function enrollInCourse(courseId: number): Promise<{ enrollment: Enrollment }> {
  const { data } = await api.post(
    `/api/courses/${courseId}/enroll`,
    {},
    { headers: authHeaders() }
  );
  return data;
}

export async function updateStudentProfile(updates: {
  full_name?: string;
  email?: string;
}): Promise<{
  student: { id: number; matric_number: string; full_name: string; email: string };
}> {
  const { data } = await api.put("/api/students/me", updates, { headers: authHeaders() });
  return data;
}

