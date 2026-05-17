import express from "express";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRoles } from "../middleware/auth";
import { encryptBuffer } from "../utils/crypto";

const router = express.Router();

router.put(
  "/me",
  authenticateToken,
  authorizeRoles("STUDENT"),
  async (req, res, next) => {
    try {
      const { full_name, email } = req.body as { full_name?: string; email?: string };
      const updates: any = {};
      if (full_name) updates.full_name = full_name;
      if (email) updates.email = email;

      const student = await prisma.student.update({
        where: { id: req.user!.studentId! },
        data: updates,
        select: {
          id: true,
          matric_number: true,
          full_name: true,
          email: true,
        },
      });
      res.json({ student });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/me",
  authenticateToken,
  authorizeRoles("STUDENT"),
  async (req, res, next) => {
    try {
      const student = await prisma.student.findUnique({
        where: { id: req.user!.studentId! },
        select: {
          id: true,
          matric_number: true,
          full_name: true,
          email: true,
        },
      });
      res.json({ student });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/stats",
  authenticateToken,
  authorizeRoles("STUDENT"),
  async (req, res, next) => {
    try {
      const studentId = req.user!.studentId!;

      const [
        totalCourses,
        totalAttendance,
        presentCount,
        lateCount,
        absentCount,
        student,
        activeSessions,
      ] = await Promise.all([
        prisma.enrollment.count({ where: { student_id: studentId } }),
        prisma.attendanceRecord.count({ where: { student_id: studentId } }),
        prisma.attendanceRecord.count({
          where: { student_id: studentId, status: "PRESENT" },
        }),
        prisma.attendanceRecord.count({
          where: { student_id: studentId, status: "LATE" },
        }),
        prisma.attendanceRecord.count({
          where: { student_id: studentId, status: "ABSENT" },
        }),
        prisma.student.findUnique({
          where: { id: studentId },
          select: { biometric_template: true },
        }),
        prisma.attendanceSession.findMany({
          where: {
            end_time: null,
            course: { enrollments: { some: { student_id: studentId } } },
          },
          include: {
            course: { select: { course_code: true, course_title: true } },
          },
          orderBy: { start_time: "desc" },
        }),
      ]);

      res.json({
        stats: {
          totalCourses,
          totalAttendance,
          presentCount,
          lateCount,
          absentCount,
          biometricRegistered: student?.biometric_template != null ? 1 : 0,
        },
        activeSessions: activeSessions.map((session) => ({
          id: session.id,
          start_time: session.start_time,
          course_code: session.course.course_code,
          course_title: session.course.course_title,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/courses",
  authenticateToken,
  authorizeRoles("STUDENT"),
  async (req, res, next) => {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { student_id: req.user!.studentId! },
        include: {
          course: {
            include: {
              lecturer: {
                select: {
                  full_name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { id: "desc" },
      });
      res.json({ courses: enrollments.map((e) => e.course) });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/attendance",
  authenticateToken,
  authorizeRoles("STUDENT"),
  async (req, res, next) => {
    try {
      const records = await prisma.attendanceRecord.findMany({
        where: { student_id: req.user!.studentId! },
        include: {
          session: {
            include: {
              course: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
      });
      res.json({ records });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/biometric",
  authenticateToken,
  authorizeRoles("STUDENT"),
  async (req, res, next) => {
    try {
      const { template } = req.body as { template?: string | Buffer };

      if (!template) {
        res.status(400).json({ error: "template is required" });
        return;
      }

      const rawBuffer =
        typeof template === "string"
          ? Buffer.from(template, "base64")
          : Buffer.isBuffer(template)
            ? template
            : Buffer.from(template);

      const encrypted = encryptBuffer(rawBuffer);

      const updated = await prisma.student.update({
        where: { id: req.user!.studentId! },
        data: {
          biometric_template: new Uint8Array(encrypted),
        },
        select: {
          id: true,
          matric_number: true,
          full_name: true,
          email: true,
        },
      });

      res.status(200).json({
        message: "Biometric template stored securely",
        student: updated,
      });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as Error).message === "string" &&
        (err as Error).message.includes("BIOMETRIC_SECRET")
      ) {
        res.status(500).json({ error: (err as Error).message });
        return;
      }
      next(err);
    }
  }
);

export default router;
