import express from "express";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRoles } from "../middleware/auth";
import { encryptBuffer } from "../utils/crypto";

const router = express.Router();

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
          : Buffer.from(template as ArrayBuffer);

      const encrypted = encryptBuffer(rawBuffer);

      const updated = await prisma.student.update({
        where: { id: req.user!.studentId! },
        data: {
          biometric_template: encrypted,
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
