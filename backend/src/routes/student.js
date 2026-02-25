const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { encryptBuffer } = require("../utils/crypto");

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

// Register or update student's biometric (fingerprint) template
router.post(
  "/biometric",
  authenticateToken,
  authorizeRoles("STUDENT"),
  async (req, res, next) => {
    try {
      const { template } = req.body;

      if (!template) {
        return res.status(400).json({ error: "template is required" });
      }

      // Expect template as base64 or raw string; convert to Buffer
      const rawBuffer =
        typeof template === "string"
          ? Buffer.from(template, "base64")
          : Buffer.from(template);

      const encrypted = encryptBuffer(rawBuffer);

      const updated = await prisma.student.update({
        where: { id: req.user.studentId },
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
    } catch (err) {
      // Surface config errors clearly
      if (err.message && err.message.includes("BIOMETRIC_SECRET")) {
        return res.status(500).json({ error: err.message });
      }
      next(err);
    }
  }
);

module.exports = router;

