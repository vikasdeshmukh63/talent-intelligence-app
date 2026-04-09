import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findByPk(payload.sub);
    if (!user) return res.status(401).json({ message: "Invalid token" });
    req.user = user;
    req.authRole = payload?.role || null;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
