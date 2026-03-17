import type { Request } from "express";

export type Role = "STUDENT" | "LECTURER";

export interface AuthUser {
  id: number;
  role: Role;
  studentId: number | null;
  lecturerId: number | null;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
