import express from "express";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRoles } from "../middleware/auth";
import { parseCreateScheduleBody } from "../lib/scheduleValidation";
import { findMatchingScheduleForToday } from "../services/sessionScheduler";
import { decryptBuffer } from "../utils/crypto";
import { matchTemplates } from "../utils/biometric";
import { countScheduledSessionOccurrences } from "../utils/scheduleOccurrences";
import { todayUtcDateOnly } from "../utils/scheduleTime";

const router = express.Router();

router.get(
  "/me",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const lecturer = await prisma.lecturer.findUnique({
        where: { id: req.user!.lecturerId! },
        select: {
          id: true,
          staff_id: true,
          full_name: true,
          email: true,
        },
      });
      res.json({ lecturer });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/me",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const { full_name, email } = req.body as { full_name?: string; email?: string };
      const updates: any = {};
      if (full_name) updates.full_name = full_name;
      if (email) updates.email = email;

      const lecturer = await prisma.lecturer.update({
        where: { id: req.user!.lecturerId! },
        data: updates,
        select: {
          id: true,
          staff_id: true,
          full_name: true,
          email: true,
        },
      });
      res.json({ lecturer });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/stats",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const lecturerId = req.user!.lecturerId!;
      const courseFilter = { lecturer_id: lecturerId };

      const courses = await prisma.course.findMany({
        where: courseFilter,
        select: { id: true },
      });
      const courseIds = courses.map((c) => c.id);

      if (courseIds.length === 0) {
        res.json({
          stats: {
            totalCourses: 0,
            totalStudents: 0,
            totalEnrollments: 0,
            totalSessions: 0,
            activeSessions: 0,
            attendanceMarked: 0,
            studentsWithBiometric: 0,
          },
        });
        return;
      }

      const sessionFilter = { course_id: { in: courseIds } };
      const enrollmentFilter = { course_id: { in: courseIds } };

      const [
        totalCourses,
        totalSessions,
        activeSessions,
        totalEnrollments,
        attendanceMarked,
        enrollments,
      ] = await Promise.all([
        prisma.course.count({ where: courseFilter }),
        prisma.attendanceSession.count({ where: sessionFilter }),
        prisma.attendanceSession.count({
          where: { ...sessionFilter, end_time: null },
        }),
        prisma.enrollment.count({ where: enrollmentFilter }),
        prisma.attendanceRecord.count({
          where: { session: { course_id: { in: courseIds } } },
        }),
        prisma.enrollment.findMany({
          where: enrollmentFilter,
          select: {
            student_id: true,
            student: { select: { biometric_template: true } },
          },
        }),
      ]);

      const uniqueStudentIds = new Set(enrollments.map((e) => e.student_id));
      const studentsWithBiometric = new Set(
        enrollments
          .filter((e) => e.student.biometric_template != null)
          .map((e) => e.student_id)
      ).size;

      res.json({
        stats: {
          totalCourses,
          totalStudents: uniqueStudentIds.size,
          totalEnrollments,
          totalSessions,
          activeSessions,
          attendanceMarked,
          studentsWithBiometric,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

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
          sessionSchedules: {
            orderBy: { start_date: "asc" },
          },
          enrollments: {
            include: {
              student: {
                select: {
                  id: true,
                  matric_number: true,
                  full_name: true,
                  email: true,
                  biometric_template: true,
                },
              },
            },
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

router.get(
  "/courses/:courseId",
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
        select: {
          id: true,
          course_code: true,
          course_title: true,
        },
      });

      if (!course) {
        res.status(404).json({ error: "Course not found or you are not the owner" });
        return;
      }

      const [actualSessionCount, schedules, enrollments, records] = await Promise.all([
        prisma.attendanceSession.count({ where: { course_id: courseId } }),
        prisma.sessionSchedule.findMany({
          where: { course_id: courseId, is_enabled: true },
          select: {
            start_date: true,
            end_date: true,
            days_of_week: true,
            is_enabled: true,
          },
        }),
        prisma.enrollment.findMany({
          where: { course_id: courseId },
          include: {
            student: {
              select: {
                id: true,
                matric_number: true,
                full_name: true,
                email: true,
              },
            },
          },
          orderBy: { student: { full_name: "asc" } },
        }),
        prisma.attendanceRecord.findMany({
          where: { session: { course_id: courseId } },
          select: { student_id: true, session_id: true, status: true },
        }),
      ]);

      const usesRecurringSchedule = schedules.length > 0;
      const scheduledSessionCount = usesRecurringSchedule
        ? countScheduledSessionOccurrences(schedules)
        : 0;
      const totalSessions = usesRecurringSchedule
        ? Math.max(scheduledSessionCount, actualSessionCount)
        : actualSessionCount;

      const attendedSessionsByStudent = new Map<number, Set<number>>();
      for (const record of records) {
        if (!attendedSessionsByStudent.has(record.student_id)) {
          attendedSessionsByStudent.set(record.student_id, new Set());
        }
        attendedSessionsByStudent.get(record.student_id)!.add(record.session_id);
      }

      const students = enrollments.map((enrollment) => {
        const sessionsAttended =
          attendedSessionsByStudent.get(enrollment.student_id)?.size ?? 0;
        const attendancePercentage =
          totalSessions > 0
            ? Math.min(
                100,
                Math.round((sessionsAttended / totalSessions) * 1000) / 10
              )
            : 0;

        return {
          id: enrollment.student.id,
          matric_number: enrollment.student.matric_number,
          full_name: enrollment.student.full_name,
          email: enrollment.student.email,
          sessions_attended: sessionsAttended,
          total_sessions: totalSessions,
          attendance_percentage: attendancePercentage,
        };
      });

      res.json({
        course,
        total_sessions: totalSessions,
        uses_recurring_schedule: usesRecurringSchedule,
        scheduled_session_count: usesRecurringSchedule ? scheduledSessionCount : null,
        actual_session_count: actualSessionCount,
        students,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/sessions",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const courseIdParam = req.query.courseId as string | undefined;
      const lecturerId = req.user!.lecturerId!;

      const where: {
        course: { lecturer_id: number };
        course_id?: number;
        start_time?: { gte?: Date; lte?: Date };
      } = {
        course: { lecturer_id: lecturerId },
      };

      if (courseIdParam) {
        const courseId = parseInt(courseIdParam, 10);
        const course = await prisma.course.findFirst({
          where: { id: courseId, lecturer_id: lecturerId },
        });
        if (!course) {
          res.status(404).json({ error: "Course not found or you are not the owner" });
          return;
        }
        where.course_id = courseId;
      }

      if (startDate || endDate) {
        where.start_time = {};
        if (startDate) {
          const [y, m, d] = startDate.split("-").map(Number);
          where.start_time.gte = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
        }
        if (endDate) {
          const [y, m, d] = endDate.split("-").map(Number);
          where.start_time.lte = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
        }
      }

      const totalSessions = await prisma.attendanceSession.count({ where });
      const totalPages = Math.ceil(totalSessions / limit) || 1;

      const sessions = await prisma.attendanceSession.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              course_code: true,
              course_title: true,
            },
          },
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
        skip: (page - 1) * limit,
        take: limit,
      });

      res.json({
        sessions,
        pagination: {
          page,
          limit,
          totalPages,
          totalSessions,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/sessions/:sessionId",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const sessionId = parseInt(req.params.sessionId as string, 10);

      const session = await prisma.attendanceSession.findFirst({
        where: {
          id: sessionId,
          course: { lecturer_id: req.user!.lecturerId! },
        },
        include: {
          course: {
            select: {
              id: true,
              course_code: true,
              course_title: true,
            },
          },
          records: {
            include: {
              student: {
                select: {
                  id: true,
                  matric_number: true,
                  full_name: true,
                  email: true,
                },
              },
            },
            orderBy: { timestamp: "asc" },
          },
        },
      });

      if (!session) {
        res.status(404).json({ error: "Session not found or you are not the owner" });
        return;
      }

      const markedStudentIds = new Set(session.records.map((r) => r.student_id));

      const enrollments = await prisma.enrollment.findMany({
        where: { course_id: session.course_id },
        include: {
          student: {
            select: {
              id: true,
              matric_number: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: { student: { full_name: "asc" } },
      });

      const unmarked_students = enrollments
        .filter((e) => !markedStudentIds.has(e.student_id))
        .map((e) => e.student);

      const enrolledCount = enrollments.length;

      res.json({
        session,
        unmarked_students,
        summary: {
          enrolled_count: enrolledCount,
          marked_count: session.records.length,
          not_marked_count: unmarked_students.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/courses/:courseId/schedules",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.courseId as string, 10);

      const course = await prisma.course.findFirst({
        where: { id: courseId, lecturer_id: req.user!.lecturerId! },
      });
      if (!course) {
        res.status(404).json({ error: "Course not found or you are not the owner" });
        return;
      }

      const data = parseCreateScheduleBody(req.body);

      const schedule = await prisma.sessionSchedule.create({
        data: {
          course_id: courseId,
          ...data,
        },
      });

      res.status(201).json({ schedule });
    } catch (err) {
      if (err instanceof Error && err.message) {
        res.status(400).json({ error: err.message });
        return;
      }
      next(err);
    }
  }
);

router.get(
  "/courses/:courseId/schedules",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.courseId as string, 10);

      const course = await prisma.course.findFirst({
        where: { id: courseId, lecturer_id: req.user!.lecturerId! },
      });
      if (!course) {
        res.status(404).json({ error: "Course not found or you are not the owner" });
        return;
      }

      const schedules = await prisma.sessionSchedule.findMany({
        where: { course_id: courseId },
        orderBy: { start_date: "asc" },
      });

      res.json({ schedules });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/schedules/:scheduleId",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const scheduleId = parseInt(req.params.scheduleId as string, 10);
      const { is_enabled } = req.body as { is_enabled?: boolean };

      const existing = await prisma.sessionSchedule.findFirst({
        where: {
          id: scheduleId,
          course: { lecturer_id: req.user!.lecturerId! },
        },
      });
      if (!existing) {
        res.status(404).json({ error: "Schedule not found or you are not the owner" });
        return;
      }

      if (typeof is_enabled !== "boolean") {
        res.status(400).json({ error: "is_enabled (boolean) is required" });
        return;
      }

      const schedule = await prisma.sessionSchedule.update({
        where: { id: scheduleId },
        data: { is_enabled },
      });

      res.json({ schedule });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/schedules/:scheduleId",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const scheduleId = parseInt(req.params.scheduleId as string, 10);

      const existing = await prisma.sessionSchedule.findFirst({
        where: {
          id: scheduleId,
          course: { lecturer_id: req.user!.lecturerId! },
        },
      });
      if (!existing) {
        res.status(404).json({ error: "Schedule not found or you are not the owner" });
        return;
      }

      await prisma.sessionSchedule.delete({ where: { id: scheduleId } });

      res.json({ message: "Schedule deleted" });
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
      const now = new Date();
      const today = todayUtcDateOnly(now);

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

      const existingActive = await prisma.attendanceSession.findFirst({
        where: { course_id: courseId, end_time: null },
      });
      if (existingActive) {
        res.status(200).json({ session: existingActive });
        return;
      }

      const matchingSchedule = await findMatchingScheduleForToday(courseId, now);

      if (matchingSchedule) {
        const scheduledSession = await prisma.attendanceSession.findFirst({
          where: {
            schedule_id: matchingSchedule.id,
            scheduled_date: today,
          },
        });

        if (scheduledSession) {
          const reopened = await prisma.attendanceSession.update({
            where: { id: scheduledSession.id },
            data: {
              end_time: null,
              manually_started: true,
              manually_ended: false,
              start_time: now,
            },
          });
          res.status(200).json({ session: reopened });
          return;
        }
      }

      const session = await prisma.attendanceSession.create({
        data: {
          course_id: courseId,
          start_time: now,
          end_time: null,
          manually_started: true,
          manually_ended: false,
          schedule_id: matchingSchedule?.id ?? null,
          scheduled_date: matchingSchedule ? today : null,
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
        data: {
          end_time: new Date(),
          manually_ended: true,
        },
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
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

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

      const where: any = { course_id: courseId };
      if (startDate || endDate) {
        where.start_time = {};
        if (startDate) {
          const [y, m, d] = startDate.split("-").map(Number);
          where.start_time.gte = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
        }
        if (endDate) {
          const [y, m, d] = endDate.split("-").map(Number);
          where.start_time.lte = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
        }
      }

      const totalSessions = await prisma.attendanceSession.count({ where });
      const totalPages = Math.ceil(totalSessions / limit);

      const sessions = await prisma.attendanceSession.findMany({
        where,
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
        skip: (page - 1) * limit,
        take: limit,
      });

      res.json({ 
        course, 
        sessions,
        pagination: {
          page,
          limit,
          totalPages,
          totalSessions,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/sessions/:sessionId/attendance",
  authenticateToken,
  authorizeRoles("LECTURER"),
  async (req, res, next) => {
    try {
      const sessionId = parseInt(req.params.sessionId as string, 10);
      const studentId = parseInt((req.body as { student_id?: number }).student_id as unknown as string, 10);

      if (!Number.isFinite(studentId)) {
        res.status(400).json({ error: "student_id is required" });
        return;
      }

      const session = await prisma.attendanceSession.findFirst({
        where: {
          id: sessionId,
          course: { lecturer_id: req.user!.lecturerId! },
        },
      });

      if (!session) {
        res.status(404).json({ error: "Session not found or you are not the owner" });
        return;
      }

      if (session.end_time !== null) {
        res.status(400).json({ error: "Cannot mark attendance on an ended session" });
        return;
      }

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          student_id_course_id: {
            student_id: studentId,
            course_id: session.course_id,
          },
        },
        include: {
          student: {
            select: {
              id: true,
              matric_number: true,
              full_name: true,
              email: true,
            },
          },
        },
      });

      if (!enrollment) {
        res.status(404).json({ error: "Student is not enrolled in this course" });
        return;
      }

      const existing = await prisma.attendanceRecord.findUnique({
        where: {
          session_id_student_id: {
            session_id: sessionId,
            student_id: studentId,
          },
        },
      });

      if (existing) {
        res.status(409).json({
          error: "Student already marked for this session",
          record: existing,
        });
        return;
      }

      const record = await prisma.attendanceRecord.create({
        data: {
          session_id: sessionId,
          student_id: studentId,
          status: "PRESENT",
        },
        include: {
          student: {
            select: {
              id: true,
              matric_number: true,
              full_name: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json({
        message: "Attendance marked present",
        student: enrollment.student,
        record,
      });
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
          : Buffer.isBuffer(template)
            ? template
            : Buffer.from(template);

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
          storedTemplate = decryptBuffer(Buffer.from(storedEncrypted));
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
