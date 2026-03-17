import express from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { signUserToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/students/register", async (req, res, next) => {
  try {
    const { matric_number, full_name, email, password } = req.body as {
      matric_number?: string;
      full_name?: string;
      email?: string;
      password?: string;
    };

    if (!matric_number || !full_name || !email || !password) {
      res.status(400).json({
        error: "matric_number, full_name, email and password are required",
      });
      return;
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
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      res.status(409).json({
        error: "Student with this matric number or email already exists",
      });
      return;
    }
    next(err);
  }
});

router.post("/students/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const student = await prisma.student.findUnique({
      where: { email },
    });

    if (!student) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, student.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
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

router.post("/lecturers/register", async (req, res, next) => {
  try {
    const { staff_id, full_name, email, password } = req.body as {
      staff_id?: string;
      full_name?: string;
      email?: string;
      password?: string;
    };

    if (!staff_id || !full_name || !email || !password) {
      res.status(400).json({
        error: "staff_id, full_name, email and password are required",
      });
      return;
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
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      res.status(409).json({
        error: "Lecturer with this staff ID or email already exists",
      });
      return;
    }
    next(err);
  }
});

router.post("/lecturers/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const lecturer = await prisma.lecturer.findUnique({
      where: { email },
    });

    if (!lecturer) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, lecturer.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
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

export default router;
