import { JobPosting } from "../models/job-posting.model.js";
import { Application } from "../models/application.model.js";

export const listOpenJobs = async (_req, res) => {
  const rows = await JobPosting.findAll({
    where: { status: "open" },
    order: [["createdAt", "DESC"]],
    attributes: ["id", "title", "description", "createdAt"],
  });
  const jobs = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description || "",
  }));
  return res.json({ jobs });
};

export const getOpenJobById = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid job id" });
  const row = await JobPosting.findOne({
    where: { id, status: "open" },
    attributes: ["id", "title", "description", "details", "status", "createdAt"],
  });
  if (!row) return res.status(404).json({ message: "Job not found" });
  return res.json({
    job: {
      id: row.id,
      title: row.title,
      description: row.description || "",
      details: row.details || null,
      status: row.status,
      createdAt: row.createdAt,
    },
  });
};

export const createJob = async (req, res) => {
  const { title, description, details } = req.body || {};
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ message: "title is required" });
  }
  const job = await JobPosting.create({
    title: title.trim(),
    description: typeof description === "string" && description.trim() ? description.trim() : null,
    details: details && typeof details === "object" ? details : null,
    recruiterId: req.user.id,
    status: "open",
  });
  return res.status(201).json({
    job: { id: job.id, title: job.title, description: job.description || "" },
  });
};

export const deleteJob = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid job id" });

  const job = await JobPosting.findByPk(id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  const isAdmin = req.user.role === "admin";
  if (!isAdmin && job.recruiterId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await Application.destroy({ where: { jobPostingId: id } });
  await job.destroy();
  return res.json({ success: true });
};
