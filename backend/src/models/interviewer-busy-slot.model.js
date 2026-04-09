import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./user.model.js";

export const InterviewerBusySlot = sequelize.define(
  "InterviewerBusySlot",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    date: { type: DataTypes.STRING(10), allowNull: false },
    timeSlot: { type: DataTypes.STRING(8), allowNull: false },
  },
  {
    tableName: "interviewer_busy_slots",
    timestamps: true,
    indexes: [{ unique: true, fields: ["userId", "date", "timeSlot"] }],
  }
);

InterviewerBusySlot.belongsTo(User, { foreignKey: "userId", as: "user" });
