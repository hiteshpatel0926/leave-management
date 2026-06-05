// backend/src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const pool = require("../config/db"); // add this

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Optional: Check if user's employee status is still ACTIVE
    const result = await pool.query(
      `SELECT e.status 
       FROM employees e 
       JOIN users u ON e.user_id = u.id 
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (result.rows.length > 0 && result.rows[0].status !== "ACTIVE") {
      return res.status(403).json({ 
        message: "Account is inactive. Please contact administrator." 
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = { authenticate, authorize };