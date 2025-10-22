const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // attach user info (id, email, etc.) to request
    next();
  } catch (err) {
    console.error("Invalid token:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}
module.exports = { authenticateToken };
