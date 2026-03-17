import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import type {  Role } from "../types/express";

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-env";

interface JwtPayload {
  sub: number;
  role?: string;
  email?: string;
  studentId?: number | null;
  lecturerId?: number | null;
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Authentication token required" });
    return;
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  try {
    const studentId = payload.studentId ?? null;
    const lecturerId = payload.lecturerId ?? null;

    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, email: true },
      });
      if (student) {
        req.user = {
          id: student.id,
          role: "STUDENT",
          studentId: student.id,
          lecturerId: null,
          email: student.email,
        };
        next();
        return;
      }
    }

    if (lecturerId) {
      const lecturer = await prisma.lecturer.findUnique({
        where: { id: lecturerId },
        select: { id: true, email: true },
      });
      if (lecturer) {
        req.user = {
          id: lecturer.id,
          role: "LECTURER",
          studentId: null,
          lecturerId: lecturer.id,
          email: lecturer.email,
        };
        next();
        return;
      }
    }

    res.status(401).json({ error: "User no longer found or invalid token" });
  } catch (err) {
    next(err);
  }
}

export function authorizeRoles(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden: insufficient permissions" });
      return;
    }
    next();
  };
}

export function signUserToken(params: {
  id: number;
  role: Role;
  email: string;
  studentId?: number | null;
  lecturerId?: number | null;
}): string {
  const payload = {
    sub: params.id,
    role: params.role,
    email: params.email,
    studentId: params.studentId ?? null,
    lecturerId: params.lecturerId ?? null,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}
