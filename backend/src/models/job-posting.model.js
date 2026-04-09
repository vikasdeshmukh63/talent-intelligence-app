import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./user.model.js";

export const JobPosting = sequelize.define(
  "JobPosting",
  {
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    details: { type: DataTypes.JSONB, allowNull: true },
    status: {
      type: DataTypes.ENUM("open", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    recruiterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "job_postings",
    timestamps: true,
  }
);

JobPosting.belongsTo(User, { foreignKey: "recruiterId", as: "recruiter" });
