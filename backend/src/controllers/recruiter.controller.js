import { Op } from "sequelize";
import { JobPosting } from "../models/job-posting.model.js";
import { Application } from "../models/application.model.js";
import { User } from "../models/user.model.js";

const toRelativePosted = (date) => {
  if (!date) return "—";
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.max(1, Math.floor(ms / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  return `${days} days ago`;
};

export const listMyJobs = async (req, res) => {
  const recruiterId = req.user.id;
  const jobs = await JobPosting.findAll({
    where: { recruiterId },
    order: [["createdAt", "DESC"]],
    attributes: ["id", "title", "description", "status", "createdAt"],
    include: [
      {
        model: Application,
        as: "applications",
        attributes: ["id", "status"],
        required: false,
      },
    ],
  });

  const out = jobs.map((j) => {
    const apps = j.applications || [];
    const applicants = apps.length;
    const shortlisted = apps.filter((a) => a.status === "Shortlisted").length;
    const interviews = apps.filter((a) => a.status === "HR Interview Scheduled").length;
    return {
      id: j.id,
      title: j.title,
      description: j.description || "",
      status: j.status,
      posted: toRelativePosted(j.createdAt),
      applicants,
      shortlisted,
      interviews,
    };
  });

  return res.json({ jobs: out });
};

export const listJobApplications = async (req, res) => {
  const recruiterId = req.user.id;
  const jobId = Number(req.params.jobId);
  if (!jobId) return res.status(400).json({ message: "Invalid jobId" });

  const job = await JobPosting.findOne({
    where: { id: jobId, recruiterId },
    attributes: ["id", "title"],
  });
  if (!job) return res.status(404).json({ message: "Job not found" });

  const applications = await Application.findAll({
    where: { jobPostingId: jobId },
    order: [["appliedAt", "DESC"]],
    include: [
      {
        model: User,
        as: "candidate",
        attributes: ["id", "name", "email", "phone", "location"],
      },
    ],
  });

  return res.json({
    job: { id: job.id, title: job.title },
    candidates: applications.map((a) => ({
      id: a.id,
      name: a.candidate?.name || "Candidate",
      email: a.candidate?.email || "",
      phone: a.candidate?.phone || "",
      location: a.candidate?.location || "",
      score: typeof a.aiScore === "number" ? a.aiScore : 0,
      status: a.status,
      applied: toRelativePosted(a.appliedAt),
      appliedAt: a.appliedAt,
      updatedAt: a.updatedAt,
      skills: Array.isArray(a.skills) ? a.skills : [],
      resumeUrl: a.resumeFileUrl || "",
    })),
  });
};

export const updateApplicationStatus = async (req, res) => {
  const recruiterId = req.user.id;
  const id = Number(req.params.id);
  const { status } = req.body || {};
  const allowed = [
    "Applied",
    "Under Review",
    "Shortlisted",
    "HR Interview Scheduled",
    "Rejected",
  ];
  if (!id) return res.status(400).json({ message: "Invalid application id" });
  if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

  const application = await Application.findByPk(id, {
    include: [{ model: JobPosting, as: "job", attributes: ["id", "recruiterId"] }],
  });
  if (!application || !application.job) return res.status(404).json({ message: "Application not found" });
  if (application.job.recruiterId !== recruiterId) return res.status(403).json({ message: "Forbidden" });

  application.status = status;
  await application.save();
  return res.json({ success: true, application: { id: application.id, status: application.status } });
};

export const getMyJob = async (req, res) => {
  const recruiterId = req.user.id;
  const jobId = Number(req.params.jobId);
  if (!jobId) return res.status(400).json({ message: "Invalid jobId" });

  const job = await JobPosting.findOne({
    where: { id: jobId, recruiterId },
    attributes: ["id", "title", "description", "status", "details", "createdAt"],
  });
  if (!job) return res.status(404).json({ message: "Job not found" });

  return res.json({
    job: {
      id: job.id,
      title: job.title,
      description: job.description || "",
      status: job.status,
      details: job.details || null,
      createdAt: job.createdAt,
      posted: toRelativePosted(job.createdAt),
    },
  });
};

