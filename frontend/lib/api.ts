import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export type Role = "student" | "lecturer";

export interface AuthResponse {
  token: string;
  student?: { id: number; matric_number: string; full_name: string; email: string };
  lecturer?: { id: number; staff_id: string; full_name: string; email: string };
}

export async function loginStudent(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/students/login", {
    email,
    password,
  });
  return data;
}

export async function registerStudent(payload: {
  matric_number: string;
  full_name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/students/register", payload);
  return data;
}

export async function loginLecturer(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/lecturers/login", {
    email,
    password,
  });
  return data;
}

export async function registerLecturer(payload: {
  staff_id: string;
  full_name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/lecturers/register", payload);
  return data;
}

// Student dashboard API (requires auth token)
function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

export async function getStudentProfile(): Promise<{ student: { id: number; matric_number: string; full_name: string; email: string } }> {
  const { data } = await api.get("/api/students/me", { headers: authHeaders() });
  return data;
}

// Lecturer dashboard API
export interface LecturerSession {
  id: number;
  course_id: number;
  start_time: string;
  end_time: string | null;
}

export interface LecturerCourse {
  id: number;
  course_code: string;
  course_title: string;
  sessions: LecturerSession[];
}

export async function getLecturerCourses(): Promise<{ courses: LecturerCourse[] }> {
  const { data } = await api.get<{ courses: LecturerCourse[] }>("/api/lecturers/courses", {
    headers: authHeaders(),
  });
  return data;
}

export async function startAttendanceSession(courseId: number): Promise<{ session: LecturerSession }> {
  const { data } = await api.post<{ session: LecturerSession }>(
    `/api/lecturers/courses/${courseId}/sessions/start`,
    {},
    { headers: authHeaders() },
  );
  return data;
}

export async function stopAttendanceSession(sessionId: number): Promise<{ session: LecturerSession }> {
  const { data } = await api.post<{ session: LecturerSession }>(
    `/api/lecturers/sessions/${sessionId}/stop`,
    {},
    { headers: authHeaders() },
  );
  return data;
}
