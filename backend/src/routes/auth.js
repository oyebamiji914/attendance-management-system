const express = require("express");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { signUserToken } = require("../middleware/auth");

const prisma = new PrismaClient();
const router = express.Router();

// Student registration
router.post("/students/register", async (req, res, next) => {
  try {
    const { matric_number, full_name, email, password } = req.body;

    if (!matric_number || !full_name || !email || !password) {
      return res.status(400).json({ error: "matric_number, full_name, email and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await prisma.student.create({
      data: {
        matric_number,
        full_name,
        email,
        password_hash: hashedPassword,
      },
    });

    const token = signUserToken({
      id: student.id,
      role: "STUDENT",
      email: student.email,
      studentId: student.id,
    });

    res.status(201).json({
      token,
      student: {
        id: student.id,
        matric_number: student.matric_number,
        full_name: student.full_name,
        email: student.email,
      },
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Student with this matric number or email already exists" });
    }
    next(err);
  }
});

// Student login
router.post("/students/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const student = await prisma.student.findUnique({
      where: { email },
    });

    if (!student) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, student.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signUserToken({
      id: student.id,
      role: "STUDENT",
      email: student.email,
      studentId: student.id,
    });

    res.json({
      token,
      student: {
        id: student.id,
        matric_number: student.matric_number,
        full_name: student.full_name,
        email: student.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Lecturer registration
router.post("/lecturers/register", async (req, res, next) => {
  try {
    const { staff_id, full_name, email, password } = req.body;

    if (!staff_id || !full_name || !email || !password) {
      return res.status(400).json({ error: "staff_id, full_name, email and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const lecturer = await prisma.lecturer.create({
      data: {
        staff_id,
        full_name,
        email,
        password_hash: hashedPassword,
      },
    });

    const token = signUserToken({
      id: lecturer.id,
      role: "LECTURER",
      email: lecturer.email,
      lecturerId: lecturer.id,
    });

    res.status(201).json({
      token,
      lecturer: {
        id: lecturer.id,
        staff_id: lecturer.staff_id,
        full_name: lecturer.full_name,
        email: lecturer.email,
      },
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Lecturer with this staff ID or email already exists" });
    }
    next(err);
  }
});

// Lecturer login
router.post("/lecturers/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const lecturer = await prisma.lecturer.findUnique({
      where: { email },
    });

    if (!lecturer) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, lecturer.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signUserToken({
      id: lecturer.id,
      role: "LECTURER",
      email: lecturer.email,
      lecturerId: lecturer.id,
    });

    res.json({
      token,
      lecturer: {
        id: lecturer.id,
        staff_id: lecturer.staff_id,
        full_name: lecturer.full_name,
        email: lecturer.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

