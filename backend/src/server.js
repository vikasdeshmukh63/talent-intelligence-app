import app from "./app.js";
import { env } from "./config/env.js";
import { sequelize } from "./config/database.js";
import "./models/user.model.js";
import "./models/job-posting.model.js";
import "./models/application.model.js";
import "./models/resume-file.model.js";
import "./models/interviewer-busy-slot.model.js";
import "./models/interview-booking.model.js";
import { seedDefaultUsers, seedDefaultJobs } from "./services/seed.service.js";

const start = async () => {
  try {
    await sequelize.authenticate();
    // Keep existing data and evolve schema for local development.
    await sequelize.sync({ alter: true });
    await seedDefaultUsers();
    await seedDefaultJobs();
    app.listen(env.port, () => {
      console.log(`Backend running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
};

start();
