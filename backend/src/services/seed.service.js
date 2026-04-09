import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { JobPosting } from "../models/job-posting.model.js";

const DEFAULT_JOB_POSTINGS = [
  {
    title: "Senior React Developer",
    description:
      "Senior front-end engineering: React, TypeScript, component architecture, performance, collaboration with product and design.",
  },
  {
    title: "Data Scientist",
    description:
      "Analytics and modeling: Python, statistics, SQL, experimentation, communicating insights to stakeholders.",
  },
  {
    title: "Product Manager",
    description:
      "Product ownership: discovery, roadmap, agile delivery, metrics, stakeholder alignment.",
  },
];

const defaults = [
  { name: "Admin User", email: "admin@esds.com", password: "password123", role: "admin" },
  { name: "CEO CHRO User", email: "ceo@esds.com", password: "ceo123", role: "ceo_chro" },
  { name: "Recruiter User", email: "recruiter@esds.com", password: "recruiter123", role: "recruiter" },
  {
    name: "Interviewer User",
    email: "interviewer@esds.com",
    password: "interviewer123",
    role: "interviewer",
  },
  { name: "Candidate User", email: "arjun@email.com", password: "candidate123", role: "candidate", phone: "+91 98765 43210", location: "Mumbai, India" },
];

export const seedDefaultUsers = async () => {
  for (const item of defaults) {
    const existing = await User.findOne({ where: { email: item.email.toLowerCase() } });
    if (existing) continue;
    const passwordHash = await bcrypt.hash(item.password, 10);
    await User.create({
      name: item.name,
      email: item.email.toLowerCase(),
      passwordHash,
      role: item.role,
      phone: item.phone || null,
      location: item.location || null,
      emailVerified: true,
      emailOtp: null,
      emailOtpExpiresAt: null,
      resetOtp: null,
      resetOtpExpiresAt: null,
    });
  }
};

export const seedDefaultJobs = async () => {
  const recruiter = await User.findOne({ where: { email: "recruiter@esds.com" } });
  if (!recruiter) return;
  for (const j of DEFAULT_JOB_POSTINGS) {
    const existing = await JobPosting.findOne({
      where: { title: j.title, recruiterId: recruiter.id },
    });
    if (existing) continue;
    await JobPosting.create({
      title: j.title,
      description: j.description,
      recruiterId: recruiter.id,
      status: "open",
    });
  }
};
