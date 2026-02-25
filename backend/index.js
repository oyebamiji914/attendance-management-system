const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./src/routes/auth");
const studentRoutes = require("./src/routes/student");
const lecturerRoutes = require("./src/routes/lecturer");
const enrollmentRoutes = require("./src/routes/enrollment");

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "attendance-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/lecturers", lecturerRoutes);
app.use("/api", enrollmentRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

