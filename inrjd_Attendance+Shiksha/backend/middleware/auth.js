const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.query.token) {
      // SSE connections pass the token as a query param
      token = req.query.token;
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "Not authorized. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select(
      "-passwordHash -passwordResetToken"
    );

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found. Token invalid." });
    }

    if (!user.isActive) {
      return res
        .status(401)
        .json({ message: "Account deactivated. Contact administrator." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ message: "Not authorized. Invalid token." });
  }
};

// ─── adminOnly ─────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

// ─── ownerOnly ─────────────────────────────────────────────────
const ownerOnly = (req, res, next) => {
  if (req.user?.role !== "owner") {
    return res.status(403).json({ message: "Access denied. Owners only." });
  }
  next();
};

// ─── superAdminOnly ────────────────────────────────────────────
const superAdminOnly = (req, res, next) => {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ message: "Access denied. SuperAdmin only." });
  }
  next();
};

module.exports = { protect, adminOnly, ownerOnly, superAdminOnly };
