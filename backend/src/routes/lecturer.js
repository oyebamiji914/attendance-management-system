const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const prisma = new PrismaClient();
const router = express.Router();

// Create a course (lecturer only)
router.post(
  "/courses",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const { course_code, course_title } = req.body;
      if (!course_code || !course_title) {
        return res.status(400).json({ error: "course_code and course_title are required" });
      }

      const course = await prisma.course.create({
        data: {
          course_code,
          course_title,
          lecturer_id: req.user.lecturerId,
        },
      });

      res.status(201).json({ course });
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: "Course with this course_code already exists" });
      }
      next(err);
    }
  }
);

// Start an attendance session
router.post(
  "/courses/:courseId/sessions/start",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      const { end_time } = req.body; // optional end time

      // Ensure course belongs to lecturer
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          lecturer_id: req.user.lecturerId,
        },
      });
      if (!course) {
        return res.status(404).json({ error: "Course not found or you are not the owner" });
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

// Stop an attendance session by setting end_time to now
router.post(
  "/sessions/:sessionId/stop",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const sessionId = parseInt(req.params.sessionId, 10);

      // Ensure session belongs to a course taught by this lecturer
      const session = await prisma.attendanceSession.findFirst({
        where: {
          id: sessionId,
          course: {
            lecturer_id: req.user.lecturerId,
          },
        },
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found or you are not the owner" });
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

// View attendance report for a course
router.get(
  "/courses/:courseId/attendance",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.courseId, 10);

      // Ensure course belongs to lecturer
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          lecturer_id: req.user.lecturerId,
        },
      });
      if (!course) {
        return res.status(404).json({ error: "Course not found or you are not the owner" });
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

module.exports = router;

