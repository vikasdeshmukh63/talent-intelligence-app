import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./user.model.js";
import { JobPosting } from "./job-posting.model.js";

export const Application = sequelize.define(
  "Application",
  {
    status: {
      type: DataTypes.ENUM(
        "Applied",
        "Under Review",
        "Shortlisted",
        "HR Interview Scheduled",
        "Rejected"
      ),
      allowNull: false,
      defaultValue: "Applied",
    },
    candidateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    jobPostingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "job_postings", key: "id" },
    },
    resumeFileUrl: { type: DataTypes.STRING, allowNull: true },
    aiScore: { type: DataTypes.INTEGER, allowNull: true },
    skills: { type: DataTypes.JSON, allowNull: true },
    appliedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "applications",
    timestamps: true,
  }
);

Application.belongsTo(User, { foreignKey: "candidateId", as: "candidate" });
Application.belongsTo(JobPosting, { foreignKey: "jobPostingId", as: "job" });
JobPosting.hasMany(Application, { foreignKey: "jobPostingId", as: "applications" });
User.hasMany(Application, { foreignKey: "candidateId", as: "applications" });

