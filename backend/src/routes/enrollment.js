const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const prisma = new PrismaClient();
const router = express.Router();

// Student enrolls in a course
router.post(
  "/courses/:courseId/enroll",
  authenticateToken,
  authorizeRoles("STUDENT"),
  async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.courseId, 10);

      const enrollment = await prisma.enrollment.create({
        data: {
          student_id: req.user.studentId,
          course_id: courseId,
        },
      });

      res.status(201).json({ enrollment });
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: "You are already enrolled in this course" });
      }
      next(err);
    }
  }
);

module.exports = router;

