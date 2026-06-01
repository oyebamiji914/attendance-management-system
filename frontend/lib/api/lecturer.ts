import { api, authHeaders } from "./client";

export interface LecturerSession {
  id: number;
  course_id: number;
  start_time: string;
  end_time: string | null;
}

export interface SessionSchedule {
  id: number;
  course_id: number;
  start_date: string;
  end_date: string;
  daily_start_time: string;
  daily_end_time: string;
  days_of_week: number[];
  is_enabled: boolean;
  created_at: string;
}

export interface LecturerCourse {
  id: number;
  course_code: string;
  course_title: string;
  sessions: LecturerSession[];
  sessionSchedules?: SessionSchedule[];
  enrollments?: {
    student: {
      id: number;
      matric_number: string;
      full_name: string;
      email: string;
      biometric_template?: string | null;
    };
  }[];
}

export interface LecturerProfile {
  id: number;
  staff_id: string;
  full_name: string;
  email: string;
}

export interface ScanFingerprintResult {
  message: string;
  student: SessionStudent;
  record: SessionAttendanceRecord;
}

export interface LecturerStats {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  totalSessions: number;
  activeSessions: number;
  attendanceMarked: number;
  studentsWithBiometric: number;
}

export async function getLecturerStats(): Promise<{ stats: LecturerStats }> {
  const { data } = await api.get<{ stats: LecturerStats }>("/api/lecturers/stats", {
    headers: authHeaders(),
  });
  return data;
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
    { headers: authHeaders() }
  );
  return data;
}

export async function stopAttendanceSession(sessionId: number): Promise<{ session: LecturerSession }> {
  const { data } = await api.post<{ session: LecturerSession }>(
    `/api/lecturers/sessions/${sessionId}/stop`,
    {},
    { headers: authHeaders() }
  );
  return data;
}

export async function createCourse(courseCode: string, courseTitle: string): Promise<{ course: LecturerCourse }> {
  const { data } = await api.post<{ course: LecturerCourse }>(
    "/api/lecturers/courses",
    { course_code: courseCode, course_title: courseTitle },
    { headers: authHeaders() }
  );
  return data;
}

export interface CourseStudentAttendance {
  id: number;
  matric_number: string;
  full_name: string;
  email: string;
  sessions_attended: number;
  total_sessions: number;
  attendance_percentage: number;
}

export interface CourseDetail {
  course: { id: number; course_code: string; course_title: string };
  total_sessions: number;
  uses_recurring_schedule?: boolean;
  scheduled_session_count?: number | null;
  actual_session_count?: number;
  students: CourseStudentAttendance[];
}

export interface SessionAttendanceRecord {
  id: number;
  timestamp: string;
  status: string;
  student: {
    id: number;
    matric_number: string;
    full_name: string;
    email: string;
  };
}

export interface SessionStudent {
  id: number;
  matric_number: string;
  full_name: string;
  email: string;
}

export interface SessionDetail {
  session: LecturerSession & {
    course: { id: number; course_code: string; course_title: string };
    records: SessionAttendanceRecord[];
  };
  unmarked_students: SessionStudent[];
  summary: {
    enrolled_count: number;
    marked_count: number;
    not_marked_count: number;
  };
}

export async function getCourseDetail(courseId: number): Promise<CourseDetail> {
  const { data } = await api.get<CourseDetail>(`/api/lecturers/courses/${courseId}`, {
    headers: authHeaders(),
  });
  return data;
}

export async function getSessionDetail(sessionId: number): Promise<SessionDetail> {
  const { data } = await api.get<SessionDetail>(`/api/lecturers/sessions/${sessionId}`, {
    headers: authHeaders(),
  });
  return data;
}

export async function markStudentPresent(
  sessionId: number,
  studentId: number
): Promise<{ student: SessionStudent; record: SessionAttendanceRecord }> {
  const { data } = await api.post(
    `/api/lecturers/sessions/${sessionId}/attendance`,
    { student_id: studentId },
    { headers: authHeaders() }
  );
  return data;
}

export async function getLecturerSessions(
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
  courseId?: number
): Promise<{
  sessions: (LecturerSession & {
    course: { id: number; course_code: string; course_title: string };
    records?: SessionAttendanceRecord[];
  })[];
  pagination: { page: number; limit: number; totalPages: number; totalSessions: number };
}> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (courseId) params.append("courseId", String(courseId));

  const { data } = await api.get(`/api/lecturers/sessions?${params.toString()}`, {
    headers: authHeaders(),
  });
  return data;
}

export async function getCourseAttendance(
  courseId: number,
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string
): Promise<{
  records: SessionAttendanceRecord[];
  pagination: { page: number; limit: number; totalPages: number; totalRecords: number };
}> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const { data } = await api.get<{
    records: SessionAttendanceRecord[];
    pagination: { page: number; limit: number; totalPages: number; totalRecords: number };
  }>(
    `/api/lecturers/courses/${courseId}/attendance?${params.toString()}`,
    { headers: authHeaders() }
  );
  return data;
}

export async function getLecturerProfile(): Promise<{ lecturer: LecturerProfile }> {
  const { data } = await api.get<{ lecturer: LecturerProfile }>("/api/lecturers/me", {
    headers: authHeaders(),
  });
  return data;
}

export async function updateLecturerProfile(updates: {
  full_name?: string;
  email?: string;
}): Promise<{ lecturer: LecturerProfile }> {
  const { data } = await api.put("/api/lecturers/me", updates, { headers: authHeaders() });
  return data;
}

export interface CreateSessionScheduleInput {
  start_date: string;
  end_date: string;
  daily_start_time: string;
  daily_end_time: string;
  days_of_week?: number[];
}

export async function createSessionSchedule(
  courseId: number,
  input: CreateSessionScheduleInput
): Promise<{ schedule: SessionSchedule }> {
  const { data } = await api.post<{ schedule: SessionSchedule }>(
    `/api/lecturers/courses/${courseId}/schedules`,
    input,
    { headers: authHeaders() }
  );
  return data;
}

export async function getCourseSchedules(
  courseId: number
): Promise<{ schedules: SessionSchedule[] }> {
  const { data } = await api.get<{ schedules: SessionSchedule[] }>(
    `/api/lecturers/courses/${courseId}/schedules`,
    { headers: authHeaders() }
  );
  return data;
}

export async function updateSessionSchedule(
  scheduleId: number,
  is_enabled: boolean
): Promise<{ schedule: SessionSchedule }> {
  const { data } = await api.patch<{ schedule: SessionSchedule }>(
    `/api/lecturers/schedules/${scheduleId}`,
    { is_enabled },
    { headers: authHeaders() }
  );
  return data;
}

export async function deleteSessionSchedule(scheduleId: number): Promise<void> {
  await api.delete(`/api/lecturers/schedules/${scheduleId}`, { headers: authHeaders() });
}

export async function scanFingerprint(
  sessionId: number,
  template: string
): Promise<ScanFingerprintResult> {
  const { data } = await api.post<ScanFingerprintResult>(
    `/api/lecturers/sessions/${sessionId}/scan`,
    { template },
    { headers: authHeaders() }
  );
  return data;
}

