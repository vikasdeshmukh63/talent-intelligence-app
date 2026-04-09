import { Application } from "../models/application.model.js";
import { JobPosting } from "../models/job-posting.model.js";

export const listMyApplications = async (req, res) => {
  const rows = await Application.findAll({
    where: { candidateId: req.user.id },
    order: [["appliedAt", "DESC"]],
    include: [
      {
        model: JobPosting,
        as: "job",
        attributes: ["id", "title", "status"],
      },
    ],
  });

  return res.json({
    applications: rows.map((a) => ({
      id: a.id,
      jobId: a.jobPostingId,
      jobTitle: a.job?.title || "Role",
      jobOpen: a.job?.status === "open",
      status: a.status,
      aiScore: typeof a.aiScore === "number" ? a.aiScore : null,
      appliedAt: a.appliedAt,
      updatedAt: a.updatedAt,
    })),
  });
};

export const applyToJob = async (req, res) => {
  const { jobId, aiScore, skills, resumeFileUrl } = req.body || {};
  const id = Number(jobId);
  if (!id) return res.status(400).json({ message: "jobId is required" });

  const job = await JobPosting.findByPk(id);
  if (!job || job.status !== "open") return res.status(404).json({ message: "Job not found" });

  const existing = await Application.findOne({
    where: { candidateId: req.user.id, jobPostingId: id },
  });
  if (existing) {
    return res.status(409).json({ message: "Already applied to this job" });
  }

  const app = await Application.create({
    candidateId: req.user.id,
    jobPostingId: id,
    aiScore: typeof aiScore === "number" ? Math.round(aiScore) : null,
    skills: Array.isArray(skills) ? skills : null,
    resumeFileUrl: typeof resumeFileUrl === "string" ? resumeFileUrl : null,
    status: "Applied",
  });

  return res.status(201).json({ application: { id: app.id, status: app.status } });
};

