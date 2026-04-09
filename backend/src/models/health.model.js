import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const HealthCheck = sequelize.define(
  "HealthCheck",
  {
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "ok" },
  },
  {
    tableName: "health_checks",
    timestamps: true,
  }
);
