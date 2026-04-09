// Shared in-memory store for all dashboards (Recruiter, Admin, CEO/CHRO)
// Using a simple event-emitter pattern for cross-component sync

const INITIAL_JOBS = [
  {
    id: 1, title: "Senior React Developer",
    applicants: 4, shortlisted: 1, interviews: 1, posted: "2 days ago",
  },
  {
    id: 2, title: "Data Scientist",
    applicants: 3, shortlisted: 1, interviews: 1, posted: "3 days ago",
  },
  {
    id: 3, title: "Product Manager",
    applicants: 2, shortlisted: 1, interviews: 0, posted: "4 days ago",
  },
];

const INITIAL_CANDIDATES = {
  "Senior React Developer": [
    { name: "Arjun Kapoor", score: 94, status: "Shortlisted", applied: "2 days ago", skills: ["React", "TypeScript", "Node.js"], recruiterEmail: "priya.mehta@esds.co.in", employeeNumber: "EMP20341", package: "18" },
    { name: "Sneha Iyer", score: 89, status: "HR Interview Scheduled", applied: "3 days ago", skills: ["React", "Redux", "GraphQL"], recruiterEmail: "priya.mehta@esds.co.in", employeeNumber: "EMP20342", package: "16" },
    { name: "Vikram Nair", score: 82, status: "Under Review", applied: "4 days ago", skills: ["React", "Vue", "CSS"], recruiterEmail: "priya.mehta@esds.co.in", employeeNumber: "EMP20343", package: "14" },
    { name: "Pooja Sharma", score: 76, status: "Applied", applied: "1 day ago", skills: ["React", "JavaScript", "HTML"], recruiterEmail: "priya.mehta@esds.co.in", employeeNumber: "EMP20344", package: "12" },
  ],
  "Data Scientist": [
    { name: "Rahul Gupta", score: 97, status: "Shortlisted", applied: "1 day ago", skills: ["Python", "ML", "TensorFlow"], recruiterEmail: "priya.mehta@esds.co.in", employeeNumber: "EMP20345", package: "22" },
    { name: "Ananya Singh", score: 91, status: "HR Interview Scheduled", applied: "2 days ago", skills: ["Python", "NLP", "PyTorch"], recruiterEmail: "priya.mehta@esds.co.in", employeeNumber: "EMP20346", package: "20" },
    { name: "Kiran Reddy", score: 85, status: "Under Review", applied: "5 days ago", skills: ["R", "Statistics", "SQL"], recruiterEmail: "priya.mehta@esds.co.in", employeeNumber: "EMP20347", package: "18" },
  ],
  "Product Manager": [
    { name: "Meera Patel", score: 92, status: "Shortlisted", applied: "3 days ago", skills: ["Strategy", "Agile", "Roadmapping"], recruiterEmail: "priya.mehta@esds.co.in", employeeNumber: "EMP20348", package: "20" },
    { name: "Suresh Kumar", score: 80, status: "Applied", applied: "1 day ago", skills: ["Product", "UX", "Analytics"], recruiterEmail: "priya.mehta@esds.co.in", employeeNumber: "EMP20349", package: "17" },
  ],
};

let _jobs = [...INITIAL_JOBS];
let _candidates = JSON.parse(JSON.stringify(INITIAL_CANDIDATES));
let _candidateStatuses = {};
let _listeners = [];

export const store = {
  getJobs: () => _jobs,
  getCandidates: () => _candidates,
  getCandidateStatuses: () => _candidateStatuses,

  addJob: (job) => {
    _jobs = [job, ..._jobs];
    if (!_candidates[job.title]) _candidates[job.title] = [];
    store._notify();
  },

  updateCandidateStatus: (jobTitle, candidateName, newStatus) => {
    const key = `${jobTitle}__${candidateName}`;
    _candidateStatuses = { ..._candidateStatuses, [key]: newStatus };
    store._notify();
  },

  getCandidateStatus: (jobTitle, candidateName, defaultStatus) => {
    const key = `${jobTitle}__${candidateName}`;
    return _candidateStatuses[key] ?? defaultStatus;
  },

  subscribe: (fn) => {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(l => l !== fn); };
  },

  _notify: () => {
    _listeners.forEach(fn => fn());
  },

  // Analytics helpers
  getStats: () => {
    const jobs = _jobs;
    const allCandidates = Object.entries(_candidates).flatMap(([jobTitle, cands]) =>
      cands.map(c => ({
        ...c,
        jobTitle,
        status: _candidateStatuses[`${jobTitle}__${c.name}`] ?? c.status,
      }))
    );
    return {
      totalJobs: jobs.length,
      totalApplicants: allCandidates.length,
      shortlisted: allCandidates.filter(c => c.status === "Shortlisted").length,
      interviews: allCandidates.filter(c => c.status === "HR Interview Scheduled").length,
      rejected: allCandidates.filter(c => c.status === "Rejected").length,
      underReview: allCandidates.filter(c => c.status === "Under Review").length,
      avgScore: allCandidates.length
        ? Math.round(allCandidates.reduce((s, c) => s + c.score, 0) / allCandidates.length)
        : 0,
      allCandidates,
      jobs,
    };
  },
};