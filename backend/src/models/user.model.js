import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const User = sequelize.define(
  "User",
  {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM("admin", "recruiter", "candidate", "ceo_chro", "interviewer"),
      allowNull: false,
    },
    additionalRoles: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    phone: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
    emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    emailOtp: { type: DataTypes.STRING, allowNull: true },
    emailOtpExpiresAt: { type: DataTypes.DATE, allowNull: true },
    resetOtp: { type: DataTypes.STRING, allowNull: true },
    resetOtpExpiresAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);
