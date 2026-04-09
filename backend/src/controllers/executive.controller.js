import { JobPosting } from "../models/job-posting.model.js";
import { Application } from "../models/application.model.js";
import { User } from "../models/user.model.js";

export const getExecutiveOverview = async (_req, res) => {
  const jobs = await JobPosting.findAll({
    order: [["createdAt", "DESC"]],
    attributes: ["id", "title", "recruiterId"],
    include: [
      {
        model: User,
        as: "recruiter",
        attributes: ["id", "email"],
        required: false,
      },
      {
        model: Application,
        as: "applications",
        required: false,
        attributes: ["id", "status", "aiScore", "appliedAt"],
        include: [
          {
            model: User,
            as: "candidate",
            attributes: ["id", "name", "email"],
            required: false,
          },
        ],
      },
    ],
  });

  const jobRows = jobs.map((j) => {
    const apps = Array.isArray(j.applications) ? j.applications : [];
    return {
      id: j.id,
      title: j.title,
      applicants: apps.length,
      shortlisted: apps.filter((a) => a.status === "Shortlisted").length,
      interviews: apps.filter((a) => a.status === "HR Interview Scheduled").length,
    };
  });

  const allCandidates = [];
  for (const j of jobs) {
    const recruiterEmail = j.recruiter?.email || "";
    const apps = Array.isArray(j.applications) ? j.applications : [];
    for (const a of apps) {
      allCandidates.push({
        id: a.id,
        name: a.candidate?.name || "Candidate",
        email: a.candidate?.email || "",
        score: typeof a.aiScore === "number" ? a.aiScore : 0,
        status: a.status || "Applied",
        jobTitle: j.title,
        recruiterEmail,
        employeeNumber: `APP-${a.id}`,
        package: null,
      });
    }
  }

  const totalApplicants = allCandidates.length;
  const shortlisted = allCandidates.filter((c) => c.status === "Shortlisted").length;
  const interviews = allCandidates.filter((c) => c.status === "HR Interview Scheduled").length;
  const rejected = allCandidates.filter((c) => c.status === "Rejected").length;
  const underReview = allCandidates.filter((c) => c.status === "Under Review").length;
  const avgScore = totalApplicants
    ? Math.round(allCandidates.reduce((sum, c) => sum + (Number(c.score) || 0), 0) / totalApplicants)
    : 0;

  return res.json({
    stats: {
      totalJobs: jobRows.length,
      totalApplicants,
      shortlisted,
      interviews,
      rejected,
      underReview,
      avgScore,
      allCandidates,
      jobs: jobRows,
    },
  });
};

