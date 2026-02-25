const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const prisma = new PrismaClient();
const router = express.Router();

// Get current student's profile
router.get(
  "/me",
  authenticateToken,
  authorizeRoles("STUDENT"),
  async (req, res, next) => {
    try {
      const student = await prisma.student.findUnique({
        where: { id: req.user.studentId },
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

// Get student's attendance history
router.get(
  "/attendance",
  authenticateToken,
  authorizeRoles("STUDENT"),
  async (req, res, next) => {
    try {
      const records = await prisma.attendanceRecord.findMany({
        where: { student_id: req.user.studentId },
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

module.exports = router;

