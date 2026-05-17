/**
 * Minimal OpenAPI 3.0 spec for the Attendance Management System backend.
 */
export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Attendance Management System API",
    version: "1.0.0",
    description: "Backend API documentation (Swagger/OpenAPI).",
  },
  servers: [
    {
      url:
        process.env.SWAGGER_SERVER_URL ??
        `http://localhost:${process.env.PORT ?? 4000}`,
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      LecturerStats: {
        type: "object",
        properties: {
          totalCourses: { type: "integer", example: 3 },
          totalStudents: { type: "integer", example: 42 },
          totalEnrollments: { type: "integer", example: 48 },
          totalSessions: { type: "integer", example: 12 },
          activeSessions: { type: "integer", example: 1 },
          attendanceMarked: { type: "integer", example: 320 },
          studentsWithBiometric: { type: "integer", example: 38 },
        },
      },
      StudentStats: {
        type: "object",
        properties: {
          totalCourses: { type: "integer", example: 4 },
          totalAttendance: { type: "integer", example: 28 },
          presentCount: { type: "integer", example: 24 },
          lateCount: { type: "integer", example: 2 },
          absentCount: { type: "integer", example: 2 },
          biometricRegistered: {
            type: "integer",
            description: "1 if biometric template is registered, otherwise 0",
            example: 1,
          },
        },
      },
      ActiveSessionSummary: {
        type: "object",
        properties: {
          id: { type: "integer", example: 10 },
          start_time: { type: "string", format: "date-time" },
          course_code: { type: "string", example: "CS101" },
          course_title: { type: "string", example: "Introduction to Programming" },
        },
      },
    },
  },
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Student" },
    { name: "Lecturer" },
    { name: "Enrollment" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: { description: "Service is healthy" },
        },
      },
    },
    "/api/auth/students/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a student",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["matric_number", "full_name", "email", "password"],
                properties: {
                  matric_number: { type: "string" },
                  full_name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Registered" },
          400: { description: "Validation error" },
          409: { description: "Duplicate student" },
        },
      },
    },
    "/api/auth/students/login": {
      post: {
        tags: ["Auth"],
        summary: "Login a student",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Logged in" },
          400: { description: "Validation error" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/lecturers/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a lecturer",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["staff_id", "full_name", "email", "password"],
                properties: {
                  staff_id: { type: "string" },
                  full_name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Registered" },
          400: { description: "Validation error" },
          409: { description: "Duplicate lecturer" },
        },
      },
    },
    "/api/auth/lecturers/login": {
      post: {
        tags: ["Auth"],
        summary: "Login a lecturer",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Logged in" },
          400: { description: "Validation error" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/students/me": {
      get: {
        tags: ["Student"],
        summary: "Get current student profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Profile returned" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/students/stats": {
      get: {
        tags: ["Student"],
        summary: "Get dashboard statistics for the current student",
        description:
          "Returns enrollment and attendance counts, biometric registration status, and live sessions for enrolled courses.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Statistics returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    stats: { $ref: "#/components/schemas/StudentStats" },
                    activeSessions: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ActiveSessionSummary" },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/students/courses": {
      get: {
        tags: ["Student"],
        summary: "List current student's enrolled courses",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Courses returned" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/students/attendance": {
      get: {
        tags: ["Student"],
        summary: "List current student's attendance history",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Attendance records returned" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/students/biometric": {
      post: {
        tags: ["Student"],
        summary: "Register/update student's biometric template",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["template"],
                properties: {
                  template: {
                    description:
                      "Base64 encoded template string (or raw bytes encoded as string).",
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Template stored" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/lecturers/stats": {
      get: {
        tags: ["Lecturer"],
        summary: "Get dashboard statistics for the current lecturer",
        description:
          "Returns aggregated counts for courses, students, sessions, attendance records, and biometric registrations across the lecturer's courses.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Statistics returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    stats: { $ref: "#/components/schemas/LecturerStats" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/lecturers/courses": {
      get: {
        tags: ["Lecturer"],
        summary: "List lecturer courses (and sessions)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Courses returned" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
      post: {
        tags: ["Lecturer"],
        summary: "Create a course",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["course_code", "course_title"],
                properties: {
                  course_code: { type: "string" },
                  course_title: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Course created" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          409: { description: "Duplicate course_code" },
        },
      },
    },
    "/api/lecturers/courses/{courseId}": {
      get: {
        tags: ["Lecturer"],
        summary: "Course detail with enrolled students and attendance percentages",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "courseId", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Course detail returned" },
          401: { description: "Unauthorized" },
          404: { description: "Course not found" },
        },
      },
    },
    "/api/lecturers/sessions": {
      get: {
        tags: ["Lecturer"],
        summary: "List all sessions for the lecturer (optional course filter)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "courseId", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Sessions returned" },
          401: { description: "Unauthorized" },
          404: { description: "Course not found" },
        },
      },
    },
    "/api/lecturers/sessions/{sessionId}": {
      get: {
        tags: ["Lecturer"],
        summary: "Session detail with students who marked attendance",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "sessionId", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Session detail returned" },
          401: { description: "Unauthorized" },
          404: { description: "Session not found" },
        },
      },
    },
    "/api/lecturers/courses/{courseId}/schedules": {
      get: {
        tags: ["Lecturer"],
        summary: "List recurring session schedules for a course",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "courseId", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Schedules returned" },
          401: { description: "Unauthorized" },
          404: { description: "Course not found" },
        },
      },
      post: {
        tags: ["Lecturer"],
        summary: "Create a recurring session schedule",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "courseId", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["start_date", "end_date", "daily_start_time", "daily_end_time"],
                properties: {
                  start_date: { type: "string", format: "date" },
                  end_date: { type: "string", format: "date" },
                  daily_start_time: { type: "string", example: "09:00" },
                  daily_end_time: { type: "string", example: "11:00" },
                  days_of_week: {
                    type: "array",
                    items: { type: "integer", minimum: 0, maximum: 6 },
                    description: "0=Sunday … 6=Saturday",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Schedule created" },
          400: { description: "Validation error" },
          404: { description: "Course not found" },
        },
      },
    },
    "/api/lecturers/schedules/{scheduleId}": {
      patch: {
        tags: ["Lecturer"],
        summary: "Enable or pause a recurring schedule",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "scheduleId", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["is_enabled"],
                properties: { is_enabled: { type: "boolean" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Schedule updated" },
          404: { description: "Schedule not found" },
        },
      },
      delete: {
        tags: ["Lecturer"],
        summary: "Delete a recurring schedule",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "scheduleId", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Schedule deleted" },
          404: { description: "Schedule not found" },
        },
      },
    },
    "/api/lecturers/courses/{courseId}/sessions/start": {
      post: {
        tags: ["Lecturer"],
        summary: "Start an attendance session",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  end_time: {
                    type: "string",
                    format: "date-time",
                    description: "Optional session end time (ISO string).",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Session started" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Course not found / not owned" },
        },
      },
    },
    "/api/lecturers/sessions/{sessionId}/stop": {
      post: {
        tags: ["Lecturer"],
        summary: "Stop an attendance session",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Session stopped" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Session not found / not owned" },
        },
      },
    },
    "/api/lecturers/courses/{courseId}/attendance": {
      get: {
        tags: ["Lecturer"],
        summary: "Get attendance report for a course",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Attendance report returned" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Course not found / not owned" },
        },
      },
    },
    "/api/lecturers/sessions/{sessionId}/attendance": {
      post: {
        tags: ["Lecturer"],
        summary: "Manually mark a student present for a live session",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "sessionId", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["student_id"],
                properties: { student_id: { type: "integer" } },
              },
            },
          },
        },
        responses: {
          201: { description: "Attendance recorded" },
          400: { description: "Session ended or validation error" },
          404: { description: "Session or student not found" },
          409: { description: "Already marked" },
        },
      },
    },
    "/api/lecturers/sessions/{sessionId}/scan": {
      post: {
        tags: ["Lecturer"],
        summary: "Scan fingerprint for a session and record attendance",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["template"],
                properties: {
                  template: {
                    type: "string",
                    description:
                      "Base64 encoded fingerprint template string.",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Attendance recorded (if match found)" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Session not found / no match found" },
        },
      },
    },
    "/api/courses/{courseId}/enroll": {
      post: {
        tags: ["Enrollment"],
        summary: "Enroll current student in a course",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          201: { description: "Enrolled" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          409: { description: "Already enrolled" },
        },
      },
    },
    "/api/courses": {
      get: {
        tags: ["Enrollment"],
        summary: "List all available courses",
        responses: {
          200: { description: "Courses returned" },
        },
      },
    },
  },
};
