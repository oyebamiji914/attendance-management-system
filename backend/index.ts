import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./src/swagger";
import authRoutes from "./src/routes/auth";
import studentRoutes from "./src/routes/student";
import lecturerRoutes from "./src/routes/lecturer";
import enrollmentRoutes from "./src/routes/enrollment";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(cors());
app.use(express.json());

app.get("/api/docs.json", (_req, res) => {
  res.json(openapiSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec, { explorer: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "attendance-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/lecturers", lecturerRoutes);
app.use("/api", enrollmentRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  if (res.headersSent) return next(err);
  const status = "status" in err ? Number((err as { status?: number }).status) : 500;
  res.status(status).json({
    error: err.message ?? "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
