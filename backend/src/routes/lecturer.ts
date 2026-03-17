import express from "express";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRoles } from "../middleware/auth";
import { decryptBuffer } from "../utils/crypto";
import { matchTemplates } from "../utils/biometric";

const router = express.Router();

router.post(
  "/courses",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const { course_code, course_title } = req.body as {
        course_code?: string;
        course_title?: string;
      };
      if (!course_code || !course_title) {
        res.status(400).json({
          error: "course_code and course_title are required",
        });
        return;
      }

      const course = await prisma.course.create({
        data: {
          course_code,
          course_title,
          lecturer_id: req.user!.lecturerId!,
        },
      });

      res.status(201).json({ course });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
        res.status(409).json({
          error: "Course with this course_code already exists",
        });
        return;
      }
      next(err);
    }
  }
);

router.get(
  "/courses",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const courses = await prisma.course.findMany({
        where: { lecturer_id: req.user!.lecturerId! },
        include: {
          sessions: {
            orderBy: { start_time: "desc" },
          },
        },
        orderBy: { course_code: "asc" },
      });
      res.json({ courses });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/courses/:courseId/sessions/start",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.courseId as string, 10);
      const { end_time } = req.body as { end_time?: string };

      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          lecturer_id: req.user!.lecturerId!,
        },
      });
      if (!course) {
        res.status(404).json({
          error: "Course not found or you are not the owner",
        });
        return;
      }

      const session = await prisma.attendanceSession.create({
        data: {
          course_id: courseId,
          start_time: new Date(),
          end_time: end_time ? new Date(end_time) : null,
        },
      });

      res.status(201).json({ session });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/sessions/:sessionId/stop",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const sessionId = parseInt(req.params.sessionId as string, 10);

      const session = await prisma.attendanceSession.findFirst({
        where: {
          id: sessionId,
          course: {
            lecturer_id: req.user!.lecturerId!,
          },
        },
      });

      if (!session) {
        res.status(404).json({
          error: "Session not found or you are not the owner",
        });
        return;
      }

      const updated = await prisma.attendanceSession.update({
        where: { id: sessionId },
        data: { end_time: new Date() },
      });

      res.json({ session: updated });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/courses/:courseId/attendance",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.courseId as string, 10);

      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          lecturer_id: req.user!.lecturerId!,
        },
      });
      if (!course) {
        res.status(404).json({
          error: "Course not found or you are not the owner",
        });
        return;
      }

      const sessions = await prisma.attendanceSession.findMany({
        where: { course_id: courseId },
        include: {
          records: {
            include: {
              student: {
                select: {
                  id: true,
                  matric_number: true,
                  full_name: true,
                },
              },
            },
          },
        },
        orderBy: { start_time: "desc" },
      });

      res.json({ course, sessions });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/sessions/:sessionId/scan",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const sessionId = parseInt(req.params.sessionId as string, 10);
      const { template } = req.body as { template?: string | Buffer };

      if (!template) {
        res.status(400).json({ error: "template is required" });
        return;
      }

      const candidateBuffer =
        typeof template === "string"
          ? Buffer.from(template, "base64")
          : Buffer.from(template as ArrayBuffer);

      const session = await prisma.attendanceSession.findFirst({
        where: {
          id: sessionId,
          course: {
            lecturer_id: req.user!.lecturerId!,
          },
        },
        include: {
          course: true,
        },
      });

      if (!session) {
        res.status(404).json({
          error: "Session not found or you are not the owner",
        });
        return;
      }

      const enrollments = await prisma.enrollment.findMany({
        where: { course_id: session.course_id },
        include: {
          student: true,
        },
      });

      let matchedStudent: { id: number; matric_number: string; full_name: string; email: string } | null = null;

      for (const enrollment of enrollments) {
        const storedEncrypted = enrollment.student.biometric_template;
        if (!storedEncrypted) continue;

        let storedTemplate: Buffer;
        try {
          storedTemplate = decryptBuffer(storedEncrypted);
        } catch {
          continue;
        }

        if (matchTemplates(storedTemplate, candidateBuffer)) {
          matchedStudent = enrollment.student;
          break;
        }
      }

      if (!matchedStudent) {
        res.status(404).json({
          error: "No matching fingerprint found for this session",
        });
        return;
      }

      let record = await prisma.attendanceRecord.findUnique({
        where: {
          session_id_student_id: {
            session_id: session.id,
            student_id: matchedStudent.id,
          },
        },
      });

      if (!record) {
        record = await prisma.attendanceRecord.create({
          data: {
            session_id: session.id,
            student_id: matchedStudent.id,
            status: "PRESENT",
          },
        });
      }

      res.status(200).json({
        message: "Fingerprint matched and attendance recorded (placeholder logic)",
        student: {
          id: matchedStudent.id,
          matric_number: matchedStudent.matric_number,
          full_name: matchedStudent.full_name,
          email: matchedStudent.email,
        },
        record,
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
