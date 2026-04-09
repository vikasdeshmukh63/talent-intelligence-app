import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./user.model.js";

export const InterviewBooking = sequelize.define(
  "InterviewBooking",
  {
    recruiterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    interviewerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    applicationId: { type: DataTypes.INTEGER, allowNull: true },
    candidateName: { type: DataTypes.STRING, allowNull: false },
    candidateEmail: { type: DataTypes.STRING, allowNull: false },
    jobTitle: { type: DataTypes.STRING, allowNull: false },
    scheduledDate: { type: DataTypes.STRING(10), allowNull: false },
    timeSlot: { type: DataTypes.STRING(8), allowNull: false },
    teamsJoinUrl: { type: DataTypes.TEXT, allowNull: true },
    teamsMeetingId: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "interview_bookings",
    timestamps: true,
    indexes: [{ unique: true, fields: ["interviewerId", "scheduledDate", "timeSlot"] }],
  }
);

InterviewBooking.belongsTo(User, { foreignKey: "recruiterId", as: "recruiter" });
InterviewBooking.belongsTo(User, { foreignKey: "interviewerId", as: "interviewer" });
