const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-env";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[0] === "Bearer" ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
      studentId: payload.studentId,
      lecturerId: payload.lecturerId,
      email: payload.email,
    };

    next();
  });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

function signUserToken({ id, role, email, studentId, lecturerId }) {
  const payload = {
    sub: id,
    role,
    email,
    studentId: studentId ?? null,
    lecturerId: lecturerId ?? null,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  signUserToken,
};

