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
  },
};
