import express from "express";
import prisma from "../lib/prisma";

const router = express.Router();

router.get("/courses", async (_req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        lecturer: {
          select: {
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { course_code: "asc" },
    });
    res.json({ courses });
  } catch (err) {
    next(err);
  }
});

export default router;
