import { api, authHeaders } from "./client";

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

