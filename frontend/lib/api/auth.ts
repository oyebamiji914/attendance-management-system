import { api } from "./client";

export type Role = "student" | "lecturer";

export interface AuthResponse {
  token: string;
  student?: { id: number; matric_number: string; full_name: string; email: string };
  lecturer?: { id: number; staff_id: string; full_name: string; email: string };
}

export async function loginStudent(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/students/login", { email, password });
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
  const { data } = await api.post<AuthResponse>("/api/auth/lecturers/login", { email, password });
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

