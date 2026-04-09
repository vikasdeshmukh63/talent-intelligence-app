import { sequelize } from "../config/database.js";

export const getHealth = async (_req, res) => {
  try {
    await sequelize.authenticate();
    return res.json({ ok: true, message: "Backend is healthy" });
  } catch (_error) {
    return res.status(500).json({ ok: false, message: "Database connection failed" });
  }
};
