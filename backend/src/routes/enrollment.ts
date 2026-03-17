import express from "express";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/courses/:courseId/enroll",
  authenticateToken,
  authorizeRoles("STUDENT"),
  async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.courseId as string, 10);

      const enrollment = await prisma.enrollment.create({
        data: {
          student_id: req.user!.studentId!,
          course_id: courseId,
        },
      });

      res.status(201).json({ enrollment });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
        res.status(409).json({
          error: "You are already enrolled in this course",
        });
        return;
      }
      next(err);
    }
  }
);

export default router;
