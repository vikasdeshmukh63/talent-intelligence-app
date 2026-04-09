import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const ResumeFile = sequelize.define(
  "ResumeFile",
  {
    objectKey: { type: DataTypes.STRING, allowNull: false, unique: true },
    fileUrl: { type: DataTypes.STRING, allowNull: false, unique: true },
    fileName: { type: DataTypes.STRING, allowNull: false },
    indexed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "resume_files",
    timestamps: true,
  }
);
