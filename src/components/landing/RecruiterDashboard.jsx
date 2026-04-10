import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";
import { apiClient } from "@/api/client";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Upload,
  Sparkles,
  FileText,
  Users,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronDown,
  Plus,
  Briefcase,
  UserCheck,
  Calendar,
  RefreshCw,
  Download,
  GitCompare,
  Mail,
  ClipboardList,
  FileDown,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import CandidateCompareModal from "@/components/recruiter/CandidateCompareModal";
import LeadsTable from "@/components/shared/LeadsTable";
import EmailModal from "@/components/recruiter/EmailModal";
import ScorecardModal from "@/components/recruiter/ScorecardModal.jsx";
import SalaryBenchmarkWidget from "@/components/recruiter/SalaryBenchmarkWidget.jsx";
import KanbanBoard from "@/components/recruiter/KanbanBoard.jsx";
import ScreeningWorkflow from "@/components/recruiter/ScreeningWorkflow.jsx";
import CalendarBookingModal from "@/components/recruiter/CalendarBookingModal.jsx";
import InterviewerAvailabilityModal from "@/components/recruiter/InterviewerAvailabilityModal.jsx";
import ApplicationPipelineGantt from "@/components/shared/ApplicationPipelineGantt.jsx";
import { useAppPopup } from "@/components/shared/AppPopupProvider";

const ESDS_LOGO = "/Logo.png";

function toYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const STATUS_COLORS = {
  "Shortlisted": "text-green-400 bg-green-400/10 border-green-400/30",
  "HR Interview Scheduled": "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "Under Review": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "Applied": "text-muted-foreground bg-muted/20 border-border/30",
};

export default function RecruiterDashboard({ onLogout, recruiterName = "Recruiter" }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const popup = useAppPopup();
  const [activeTab, setActiveTab] = useState("overview");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [candidateStatuses, setCandidateStatuses] = useState({});
  const [_loadingJobs, setLoadingJobs] = useState(false);
  const [_loadingCandidates, setLoadingCandidates] = useState(false);

  // Auto-select first job when switching to candidates or board tab
  useEffect(() => {
    if ((activeTab === "candidates" || activeTab === "board") && !selectedJob && jobs.length > 0) {
      setSelectedJob(jobs[0]);
    }
  }, [activeTab, jobs, selectedJob]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingJobs(true);
        const { jobs: myJobs } = await apiClient.recruiter.listMyJobs();
        setJobs(Array.isArray(myJobs) ? myJobs : []);
      } catch (error) {
        console.error(error);
        popup.alert(error?.message || "Failed to load recruiter jobs.");
      } finally {
        setLoadingJobs(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const s = await apiClient.interviews.getMySchedule();
        const y = toYmd(new Date());
        const mine = Array.isArray(s?.scheduledByMe) ? s.scheduledByMe : [];
        const hosting = Array.isArray(s?.hostingInterviews) ? s.hostingInterviews : [];
        const n = [...mine, ...hosting].filter((x) => x.scheduledDate === y).length;
        setInterviewsToday(n);
      } catch {
        setInterviewsToday(0);
      }
    })();
  }, []);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [showScreeningModal, setShowScreeningModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [interviewsToday, setInterviewsToday] = useState(0);
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [scorecards, setScorecards] = useState({});
  const [showJDModal, setShowJDModal] = useState(false);
  const [jdMode, setJdMode] = useState("upload"); // "upload" | "ai"
  const [jdFile, setJdFile] = useState(null);
  const [extractingJd, setExtractingJd] = useState(false);
  const [jdExtracted, setJdExtracted] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingJD, setGeneratingJD] = useState(false);
  const [generatedJD, setGeneratedJD] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [recruiterBudget, setRecruiterBudget] = useState("");
  const [jobBudgets, setJobBudgets] = useState({});
  const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false);
  const fileRef = useRef(null);

  const JOB_TITLE_OPTIONS = [
    "Senior React Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "Data Scientist", "Machine Learning Engineer", "AI/ML Engineer", "Data Analyst",
    "Product Manager", "Product Owner", "UX Designer", "UI/UX Designer",
    "DevOps Engineer", "Cloud Architect", "Site Reliability Engineer", "QA Engineer",
    "Software Engineer", "Senior Software Engineer", "Engineering Manager",
    "HR Manager", "Talent Acquisition Specialist", "Business Analyst", "Scrum Master",
  ];

  const handleGenerateJD = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingJD(true);
    setGeneratedJD("");
    const res = await apiClient.integrations.Core.InvokeLLM({
      prompt: `Generate a professional Job Description for: "${aiPrompt}".
Include: Job Title, About the Role, Key Responsibilities (5 points), Required Skills (6 skills), Nice-to-Have Skills (3), Experience Required, and What We Offer.
Keep it concise and modern. Format with clear sections.`,
    });
    setGeneratedJD(res);
    setGeneratingJD(false);
  };

  const detailsToDescription = (d) => {
    if (!d) return "";
    const lines = [];
    if (d.jobTitle) lines.push(`Job Title: ${d.jobTitle}`);
    if (d.role) lines.push(`Role: ${d.role}`);
    if (d.seniority) lines.push(`Seniority: ${d.seniority}`);
    if (d.employmentType) lines.push(`Employment type: ${d.employmentType}`);
    if (typeof d.experienceMinYears === "number" || typeof d.experienceMaxYears === "number") {
      lines.push(`Experience: ${d.experienceMinYears ?? ""}-${d.experienceMaxYears ?? ""} years`);
    }
    if (d.workArrangement) lines.push(`Work arrangement: ${d.workArrangement}`);
    if (d.locations?.country || (d.locations?.cities || []).length) {
      lines.push(
        `Locations: ${[d.locations?.country, ...(d.locations?.cities || [])].filter(Boolean).join(", ")}`
      );
    }
    if (d.salary?.currency || d.salary?.min || d.salary?.max) {
      lines.push(
        `Salary: ${d.salary?.currency || ""} ${d.salary?.min || ""}-${d.salary?.max || ""} ${d.salary?.frequency || ""}`.trim()
      );
    }
    if (d.jobSummary) lines.push(`\nJob summary:\n${d.jobSummary}`);
    if ((d.responsibilities || []).length) lines.push(`\nResponsibilities:\n- ${(d.responsibilities || []).join("\n- ")}`);
    if ((d.perksAndBenefits || []).length) lines.push(`\nPerks & benefits:\n- ${(d.perksAndBenefits || []).join("\n- ")}`);
    if ((d.additionalRequirements || []).length) lines.push(`\nAdditional requirements:\n- ${(d.additionalRequirements || []).join("\n- ")}`);
    return lines.join("\n");
  };

  const handleExtractJd = async (file) => {
    if (!file) return;
    setJdFile(file);
    setExtractingJd(true);
    setJdExtracted(null);
    try {
      const data = await apiClient.jobs.extractFromPdf(file);
      setJdExtracted({
        jobTitle: data?.jobTitle || "",
        role: data?.role || "",
        seniority: data?.seniority || "",
        experienceMinYears: data?.experienceMinYears ?? "",
        experienceMaxYears: data?.experienceMaxYears ?? "",
        employmentType: data?.employmentType || "",
        salary: {
          currency: data?.salary?.currency || "INR",
          min: data?.salary?.min ?? "",
          max: data?.salary?.max ?? "",
          frequency: data?.salary?.frequency || "Yearly",
        },
        workArrangement: data?.workArrangement || "",
        locations: {
          country: data?.locations?.country || "",
          cities: Array.isArray(data?.locations?.cities) ? data.locations.cities : [],
        },
        jobSummary: data?.jobSummary || "",
        responsibilities: Array.isArray(data?.responsibilities) ? data.responsibilities : [],
        perksAndBenefits: Array.isArray(data?.perksAndBenefits) ? data.perksAndBenefits : [],
        skills: Array.isArray(data?.skills)
          ? data.skills.map((s) => ({ name: s?.name || "", mandatory: !!s?.mandatory })).filter((s) => s.name.trim())
          : [],
        minimumEducationQualification: data?.minimumEducationQualification || "",
        courseOrSpecialization: data?.courseOrSpecialization || "",
        additionalRequirements: Array.isArray(data?.additionalRequirements) ? data.additionalRequirements : [],
        status: data?.status || "Published",
        applicationDeadline: data?.applicationDeadline || "",
        employmentStartDate: data?.employmentStartDate || "",
        keyCallout: data?.keyCallout || "",
        googleMapsOfficeLocationUrl: data?.googleMapsOfficeLocationUrl || "",
      });
      setNewJobTitle(data?.jobTitle || newJobTitle);
    } catch (error) {
      console.error(error);
      await popup.alert(error?.message || "Failed to extract details from PDF.");
    } finally {
      setExtractingJd(false);
    }
  };

  const handlePostJob = async () => {
    const title =
      (jdExtracted?.jobTitle || "").trim() ||
      newJobTitle.trim() ||
      aiPrompt.trim() ||
      (jdFile?.name?.replace(/\.[^.]+$/, "")) ||
      "New Position";
    const description = jdExtracted ? detailsToDescription(jdExtracted) : (typeof generatedJD === "string" ? generatedJD : "");
    try {
      await apiClient.jobs.create({ title, description, details: jdExtracted || null });
    } catch (err) {
      console.error(err);
      await popup.alert(err?.message || "Could not save the job. Please try again.");
      return;
    }
    try {
      const { jobs: myJobs } = await apiClient.recruiter.listMyJobs();
      setJobs(Array.isArray(myJobs) ? myJobs : []);
    } catch (error) {
      console.error(error);
    }
    if (recruiterBudget.trim()) {
      setJobBudgets((prev) => ({ ...prev, [title]: recruiterBudget.trim() }));
    }
    setShowJDModal(false);
    setGeneratedJD("");
    setAiPrompt("");
    setJdFile(null);
    setJdExtracted(null);
    setNewJobTitle("");
    setRecruiterBudget("");
  };

  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  const scorecardStorageKey = "recruiter_scorecards_v1";

  const getCandidateStatus = (jobTitle, candidateName, defaultStatus) => {
    return candidateStatuses[`${jobTitle}__${candidateName}`] ?? defaultStatus;
  };

  const updateCandidateStatus = async (jobTitle, candidateName, newStatus) => {
    const candidate = candidates.find((c) => c.name === candidateName);
    if (!candidate?.id) return;
    try {
      await apiClient.recruiter.updateApplicationStatus(candidate.id, newStatus);
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidate.id ? { ...c, status: newStatus } : c))
      );
      setCandidateStatuses((prev) => ({
        ...prev,
        [`${jobTitle}__${candidateName}`]: newStatus,
      }));
    } catch (error) {
      console.error(error);
      await popup.alert(error?.message || "Failed to update status.");
    }
    setOpenStatusDropdown(null);
  };

  const STATUS_OPTIONS = ["Applied", "Under Review", "Shortlisted", "HR Interview Scheduled", "Rejected"];
  const [aiNotes, setAiNotes] = useState({});
  const [loadingNote, setLoadingNote] = useState({});

  useEffect(() => {
    if (!selectedJob?.id) return;
    (async () => {
      try {
        setLoadingCandidates(true);
        const { candidates: rows } = await apiClient.recruiter.listApplications(selectedJob.id);
        const list = Array.isArray(rows) ? rows : [];
        setCandidates(list);
        setCandidateStatuses(
          list.reduce((acc, c) => {
            acc[`${selectedJob.title}__${c.name}`] = c.status;
            return acc;
          }, {})
        );
      } catch (error) {
        console.error(error);
        popup.alert(error?.message || "Failed to load candidates for job.");
      } finally {
        setLoadingCandidates(false);
      }
    })();
  }, [selectedJob?.id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(scorecardStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setScorecards(parsed);
      }
    } catch (_err) {
      // ignore malformed persisted scorecards
    }
  }, []);

  const saveScorecard = (jobTitle, candidateName, payload) => {
    const key = `${jobTitle}__${candidateName}`;
    setScorecards((prev) => {
      const next = { ...prev, [key]: payload };
      localStorage.setItem(scorecardStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const generateNote = async (candidate, jobTitle) => {
    const key = `${jobTitle}__${candidate.name}`;
    if (aiNotes[key] || loadingNote[key]) return;
    setLoadingNote(prev => ({ ...prev, [key]: true }));
    const note = await apiClient.integrations.Core.InvokeLLM({
      prompt: `In exactly 2 sentences, explain why ${candidate.name} (skills: ${candidate.skills.join(", ")}, AI match score: ${candidate.score}%) is a strong candidate for the "${jobTitle}" role. Be specific and concise.`,
    });
    setAiNotes(prev => ({ ...prev, [key]: note }));
    setLoadingNote(prev => ({ ...prev, [key]: false }));
  };

  const downloadExcel = (type) => {
    if (type === "candidates" && selectedJob) {
      const rows = [
        ["Candidate Name", "AI Score (%)", "Status", "Applied", "Skills"],
        ...candidates.map(c => [c.name, c.score, c.status, c.applied, c.skills.join(", ")])
      ];
      const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `${selectedJob.title.replace(/ /g, "_")}_Candidates_Report.csv`;
      a.click(); URL.revokeObjectURL(url);
    } else if (type === "overview") {
      const rows = [
        ["Job Title", "Total Applicants", "Shortlisted", "Interviews Scheduled", "Posted"],
        ...jobs.map(j => [j.title, j.applicants, j.shortlisted, j.interviews, j.posted])
      ];
      const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `eNlight_Talent_Jobs_Report.csv`;
      a.click(); URL.revokeObjectURL(url);
    }
  };

  const handleDeleteJob = async (job) => {
    const confirmed = await popup.confirm(
      `Delete job "${job.title}"? This will also delete all applications for this job.`,
      { title: "Delete job", confirmText: "Delete", cancelText: "Cancel" }
    );
    if (!confirmed) return;
    try {
      await apiClient.jobs.delete(job.id);
      const { jobs: myJobs } = await apiClient.recruiter.listMyJobs();
      const updated = Array.isArray(myJobs) ? myJobs : [];
      setJobs(updated);
      if (selectedJob?.id === job.id) {
        setSelectedJob(updated[0] || null);
        setCandidates([]);
        setCandidateStatuses({});
      }
      if (activeTab === "candidates" && updated.length === 0) {
        setActiveTab("overview");
      }
    } catch (error) {
      console.error(error);
      await popup.alert(error?.message || "Failed to delete job.");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-background overflow-y-auto">
      {/* Background */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(hsl(190,90%,50%) 1px, transparent 1px), linear-gradient(90deg, hsl(190,90%,50%) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={ESDS_LOGO} alt="ESDS" className="w-10 h-10 object-contain" />
          <div>
            <div className="font-bold text-sm text-foreground">{recruiterName}</div>
            <div className={`font-mono text-[10px] uppercase tracking-wider font-bold ${theme === 'light' ? 'text-[#003d82]' : 'text-white'}`}>Recruiter · eNlight Talent</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/recruiter/jobs/new")}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5" /> Post New JD
          </button>
          <button
            type="button"
            onClick={() => setShowAvailabilityModal(true)}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-muted/50"
          >
            <Calendar className="w-3.5 h-3.5" /> My availability
          </button>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-mono transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
          {[
            { label: "Open Positions", value: jobs.length, icon: <Briefcase className="w-4 h-4" />, color: "text-cyan-400" },
            { label: "Total Applicants", value: jobs.reduce((a, j) => a + j.applicants, 0), icon: <Users className="w-4 h-4" />, color: "text-blue-400" },
            { label: "Shortlisted", value: jobs.reduce((a, j) => a + j.shortlisted, 0), icon: <UserCheck className="w-4 h-4" />, color: "text-green-400" },
            { label: "Interviews Today", value: interviewsToday, icon: <Calendar className="w-4 h-4" />, color: "text-amber-400" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`bg-card/60 rounded-xl p-4 ${theme === 'light' ? 'border-2 border-blue-900/40' : 'border-2 border-cyan-400/30'}`}>
              <div className={theme === 'light' ? 'mb-2 text-gray-700' : `${s.color} mb-2`}>{s.icon}</div>
              <div className={`font-display text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : s.color}`}>{s.value}</div>
              <div className={`font-mono text-[11px] ${theme === 'light' ? 'text-gray-700' : 'text-muted-foreground'} uppercase tracking-wider mt-0.5`}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 sm:mb-6 bg-card/40 border border-border/30 rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
          {["overview", "candidates", "board", "leads"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <LeadsTable showActions={true} />
        )}

        {/* Board Tab */}
         {activeTab === "board" && (
           <div>
             {/* Job selector */}
             <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-5 flex-wrap">
               {jobs.map(job => (
                 <button key={job.id} onClick={() => setSelectedJob(job)}
                   className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${selectedJob?.id === job.id ? `bg-primary/20 border-primary text-primary ${theme === 'light' ? 'border-2 border-blue-900/40' : 'border'}` : `border-border/40 text-muted-foreground hover:border-primary/40 ${theme === 'light' ? 'border-2 border-blue-900/40' : 'border'}`}`}>
                  {job.title}
                </button>
              ))}
            </div>
            {selectedJob ? (
              <KanbanBoard
                candidates={candidates}
                jobTitle={selectedJob.title}
                candidateStatuses={candidateStatuses}
                onStatusUpdate={updateCandidateStatus}
                onBook={(c) => { setActiveCandidate(c); setShowCalendarModal(true); }}
                onEmail={(c) => { setActiveCandidate(c); setShowEmailModal(true); }}
                onScorecard={(c) => { setActiveCandidate(c); setShowScorecardModal(true); }}
              />
            ) : (
              <div className="text-center text-muted-foreground font-mono text-sm py-16">Select a job to view the board</div>
            )}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <h3 className={`font-semibold text-sm ${theme === 'light' ? 'text-gray-900' : 'text-foreground'}`}>Active Job Postings</h3>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-muted-foreground">{jobs.length} positions open</span>
                <button onClick={() => downloadExcel("overview")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${theme === 'light' ? 'border-green-700 text-green-700 hover:bg-green-700/10' : 'border-green-500/40 text-green-400 hover:bg-green-500/10'}`}>
                  <Download className="w-3 h-3" /> Export Excel
                </button>
              </div>
            </div>
            {jobs.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                onClick={() => { setSelectedJob(job); setActiveTab("candidates"); }}
                className={`flex items-center justify-between bg-card/50 rounded-xl px-5 py-4 cursor-pointer transition-all group ${theme === 'light' ? 'border-2 border-blue-900/40 hover:border-blue-900/60' : 'border-2 border-cyan-400/30 hover:border-cyan-400/50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className={`font-semibold text-sm ${theme === 'light' ? 'text-gray-900' : 'text-foreground'}`}>{job.title}</div>
                    <div className={`font-mono text-[11px] ${theme === 'light' ? 'text-gray-700' : 'text-muted-foreground'} mt-0.5`}>Posted {job.posted}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center hidden sm:block">
                    <div className={`font-bold text-sm ${theme === 'light' ? 'text-gray-900' : 'text-foreground'}`}>{job.applicants}</div>
                    <div className={`font-mono text-[10px] ${theme === 'light' ? 'text-gray-700' : 'text-muted-foreground'} uppercase`}>Applied</div>
                  </div>
                  <div className="text-center hidden sm:block">
                    <div className="font-bold text-sm text-green-400">{job.shortlisted}</div>
                    <div className="font-mono text-[9px] text-muted-foreground uppercase">Shortlisted</div>
                  </div>
                  <div className="text-center hidden sm:block">
                    <div className="font-bold text-sm text-blue-400">{job.interviews}</div>
                    <div className="font-mono text-[9px] text-muted-foreground uppercase">Interviews</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteJob(job);
                    }}
                    className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                    title="Delete job"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/recruiter/jobs/${job.id}`);
                    }}
                    className="p-2 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all"
                    title="View job post"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === "candidates" && (
          <div>
            {/* Job selector */}
            <div className="mb-5 max-w-md">
              <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Select Job Post
              </label>
              <select
                value={selectedJob?.id || ""}
                onChange={(e) => {
                  const selectedId = Number(e.target.value);
                  const selected = jobs.find((j) => j.id === selectedId) || null;
                  setSelectedJob(selected);
                }}
                className={`w-full h-10 rounded-lg px-3 text-xs font-mono bg-background/50 border ${
                  theme === "light" ? "border-blue-900/40 text-gray-900" : "border-border/40 text-foreground"
                }`}
              >
                <option value="" disabled>
                  Select a job
                </option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedJob ? (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between mb-2 sm:mb-3 flex-wrap gap-2">
                  <h3 className={`font-semibold text-xs sm:text-sm ${theme === 'light' ? 'text-gray-900' : 'text-foreground'}`}>{selectedJob.title}</h3>
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      <span className="text-foreground font-bold">{candidates.length}</span> candidates
                    </span>
                    <button onClick={() => setShowCompareModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 text-xs font-mono transition-all">
                      <GitCompare className="w-3 h-3" /> Compare
                    </button>
                    <button onClick={() => downloadExcel("candidates")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${theme === 'light' ? 'border-green-700 text-green-700 hover:bg-green-700/10' : 'border-green-500/40 text-green-400 hover:bg-green-500/10'}`}>
                      <Download className="w-3 h-3" /> Export
                    </button>
                  </div>
                </div>

                {/* Hiring funnel count cards (real data) */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 mb-4">
                  {[
                    {
                      label: "Total Candidates",
                      value: candidates.length,
                      color: theme === "light" ? "text-gray-900" : "text-white",
                    },
                    {
                      label: "Applied",
                      value: candidates.filter((c) => getCandidateStatus(selectedJob.title, c.name, c.status) === "Applied").length,
                      color: theme === "light" ? "text-gray-900" : "text-muted-foreground",
                    },
                    {
                      label: "Under Review",
                      value: candidates.filter((c) => getCandidateStatus(selectedJob.title, c.name, c.status) === "Under Review").length,
                      color: "text-amber-400",
                    },
                    {
                      label: "Shortlisted",
                      value: candidates.filter((c) => getCandidateStatus(selectedJob.title, c.name, c.status) === "Shortlisted").length,
                      color: "text-green-400",
                    },
                    {
                      label: "HR Interview Scheduled",
                      value: candidates.filter((c) => getCandidateStatus(selectedJob.title, c.name, c.status) === "HR Interview Scheduled").length,
                      color: "text-blue-400",
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`bg-card/60 rounded-xl p-3 sm:p-4 ${
                        theme === "light" ? "border-2 border-blue-900/40" : "border-2 border-white/30"
                      }`}
                    >
                      <div className={`font-display text-xl sm:text-2xl font-bold ${item.color}`}>{item.value}</div>
                      <div
                        className={`font-mono text-[10px] sm:text-[11px] uppercase tracking-wider mt-0.5 ${
                          theme === "light" ? "text-gray-700" : "text-muted-foreground"
                        }`}
                      >
                        {item.label}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {candidates.map((c, i) => {
                  const key = `${selectedJob.title}__${c.name}`;
                  const note = aiNotes[key];
                  const loading = loadingNote[key];
                  const scorecard = scorecards[key];
                  const currentStatus = getCandidateStatus(selectedJob.title, c.name, c.status);
                  const isDropdownOpen = openStatusDropdown === key;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className={`bg-card/50 rounded-xl px-5 py-3.5 ${theme === 'light' ? 'border-2 border-blue-900/40' : 'border-2 border-white/30'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                            {c.name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-foreground">{c.name}</div>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {c.skills.map(s => (
                                <span key={s} className="font-mono text-[9px] px-1.5 py-0.5 rounded-full border border-primary/20 text-primary/70 bg-primary/5">{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className={`font-mono text-sm font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{c.score}%</div>
                            <div className="font-mono text-[9px] text-muted-foreground uppercase">AI Score</div>
                          </div>
                          {/* Status dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenStatusDropdown(isDropdownOpen ? null : key)}
                              className={`font-mono text-[10px] px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all hover:opacity-80 ${STATUS_COLORS[currentStatus] || STATUS_COLORS["Applied"]}`}
                            >
                              {currentStatus}
                              <ChevronRight className="w-2.5 h-2.5 rotate-90" />
                            </button>
                            <AnimatePresence>
                              {isDropdownOpen && (
                                <>
                                  <div className="fixed inset-0 z-[10]" onClick={() => setOpenStatusDropdown(null)} />
                                  <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute right-0 top-full mt-1.5 w-52 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-[20]"
                                  >
                                    {STATUS_OPTIONS.map(opt => (
                                      <button
                                        key={opt}
                                        onClick={() => updateCandidateStatus(selectedJob.title, c.name, opt)}
                                        className={`w-full text-left px-4 py-2.5 font-mono text-[11px] flex items-center gap-3 transition-colors hover:bg-muted/30 border-b border-border/20 last:border-b-0 ${currentStatus === opt ? "bg-muted/20" : ""}`}
                                      >
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                          opt === "Shortlisted" ? "bg-green-400" :
                                          opt === "HR Interview Scheduled" ? "bg-blue-400" :
                                          opt === "Under Review" ? "bg-amber-400" :
                                          opt === "Rejected" ? "bg-red-400" : "bg-muted-foreground"
                                        }`} />
                                        <span className={`flex-1 ${STATUS_COLORS[opt]?.split(" ")[0] || "text-muted-foreground"}`}>{opt}</span>
                                        {currentStatus === opt && <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />}
                                      </button>
                                    ))}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      {scorecard ? (
                        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-primary/70">
                              Saved Scorecard
                            </span>
                            <span className="font-mono text-[11px] text-foreground">
                              Overall: <span className="font-bold text-primary">{scorecard.overallScore ?? "—"} / 5</span>
                            </span>
                          </div>
                          {scorecard.summary ? (
                            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                              {scorecard.summary}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-3">
                        <ApplicationPipelineGantt
                          status={currentStatus}
                          appliedAt={c.appliedAt}
                          updatedAt={c.updatedAt}
                          jobTitle={selectedJob.title}
                          compact={false}
                          theme={theme === "light" ? "light" : "dark"}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {["Shortlisted", "HR Interview Scheduled"].includes(currentStatus) ? (
                          <button onClick={() => { setActiveCandidate(c); setShowCalendarModal(true); }}
                            className="flex items-center gap-1.5 text-[11px] font-mono text-blue-400 border border-blue-400/30 hover:bg-blue-400/10 rounded-lg px-3 py-1.5 transition-all">
                            <Calendar className="w-3 h-3" /> Book Interview
                          </button>
                        ) : null}
                        <button onClick={() => { setActiveCandidate(c); setShowEmailModal(true); }}
                          className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 border border-amber-400/30 hover:bg-amber-400/10 rounded-lg px-3 py-1.5 transition-all">
                          <Mail className="w-3 h-3" /> Send Email
                        </button>
                        <button onClick={() => { setActiveCandidate(c); setShowScorecardModal(true); }}
                          className="flex items-center gap-1.5 text-[11px] font-mono text-primary/70 border border-primary/30 hover:bg-primary/10 rounded-lg px-3 py-1.5 transition-all">
                          <ClipboardList className="w-3 h-3" /> Scorecard
                        </button>
                        <button
                          onClick={async () => {
                            if (!c.resumeUrl) {
                              await popup.alert("No resume file was attached by this candidate.");
                              return;
                            }
                            try {
                              const token = localStorage.getItem("talent_token");
                              const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
                              const params = new URLSearchParams({ file_url: c.resumeUrl });
                              const response = await fetch(`${apiBase}/api/uploads/download?${params.toString()}`, {
                                headers: token ? { Authorization: `Bearer ${token}` } : {},
                              });
                              if (!response.ok) {
                                throw new Error(`Failed to download resume (${response.status})`);
                              }
                              const blob = await response.blob();
                              const url = URL.createObjectURL(blob);
                              const extensionGuess = c.resumeUrl.split("?")[0].split(".").pop()?.toLowerCase() || "pdf";
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `${c.name.replace(/\s+/g, "_")}_Resume.${extensionGuess}`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            } catch (error) {
                              console.error("Resume download failed:", error);
                              await popup.alert("Could not download resume file. Please try again.");
                            }
                          }}
                          className="flex items-center gap-1.5 text-[11px] font-mono text-green-400 border border-green-400/30 hover:bg-green-400/10 rounded-lg px-3 py-1.5 transition-all"
                        >
                          <FileDown className="w-3 h-3" /> Download Resume
                        </button>
                      </div>

                      {/* Salary Benchmark Widget */}
                      <SalaryBenchmarkWidget candidate={c} jobTitle={selectedJob.title} recruiterBudget={jobBudgets[selectedJob.title]} />

                      {/* Quick Notes */}
                      <div className="mt-3 pt-3 border-t border-border/30">
                        {note ? (
                          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
                            <Sparkles className="w-3.5 h-3.5 text-primary/70 flex-shrink-0 mt-0.5" />
                            <p className="font-sans text-[11px] text-muted-foreground leading-relaxed flex-1">{note}</p>
                            <button onClick={() => setAiNotes(prev => { const n = {...prev}; delete n[key]; return n; })}
                              className="text-muted-foreground hover:text-foreground flex-shrink-0 ml-1">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        ) : (
                          <button onClick={() => generateNote(c, selectedJob.title)} disabled={loading}
                            className="flex items-center gap-1.5 text-[11px] font-mono text-primary/60 hover:text-primary border border-primary/20 hover:border-primary/40 rounded-lg px-3 py-1.5 transition-all">
                            {loading ? (
                              <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw className="w-3 h-3" /></motion.span> Generating AI notes...</>
                            ) : (
                              <><Sparkles className="w-3 h-3" /> Generate AI Quick Notes</>
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground font-mono text-sm py-16">Select a job to view candidates</div>
            )}
          </div>
        )}
      </div>

      {/* Compare Modal */}
      {showCompareModal && selectedJob && (
        <CandidateCompareModal
          candidates={candidates}
          jobTitle={selectedJob.title}
          onClose={() => setShowCompareModal(false)}
        />
      )}

      {/* Calendar Booking Modal */}
      {showBookingModal && activeCandidate && (
        <CalendarBookingModal
          candidate={activeCandidate}
          jobTitle={selectedJob?.title}
          applicationId={activeCandidate.id}
          onBooked={() => {
            if (!selectedJob?.title || !activeCandidate?.name) return;
            const key = `${selectedJob.title}__${activeCandidate.name}`;
            setCandidateStatuses((prev) => ({ ...prev, [key]: "HR Interview Scheduled" }));
            setCandidates((prev) =>
              prev.map((c) => (c.id === activeCandidate.id ? { ...c, status: "HR Interview Scheduled" } : c))
            );
          }}
          onClose={() => { setShowBookingModal(false); setActiveCandidate(null); }}
        />
      )}

      {/* Calendar Booking Modal (from board) */}
      {showCalendarModal && activeCandidate && (
        <CalendarBookingModal
          candidate={activeCandidate}
          jobTitle={selectedJob?.title}
          applicationId={activeCandidate.id}
          onBooked={() => {
            if (!selectedJob?.title || !activeCandidate?.name) return;
            const key = `${selectedJob.title}__${activeCandidate.name}`;
            setCandidateStatuses((prev) => ({ ...prev, [key]: "HR Interview Scheduled" }));
            setCandidates((prev) =>
              prev.map((c) => (c.id === activeCandidate.id ? { ...c, status: "HR Interview Scheduled" } : c))
            );
          }}
          onClose={() => { setShowCalendarModal(false); setActiveCandidate(null); }}
        />
      )}

      {showAvailabilityModal && (
        <InterviewerAvailabilityModal
          onClose={() => {
            setShowAvailabilityModal(false);
            (async () => {
              try {
                const s = await apiClient.interviews.getMySchedule();
                const y = toYmd(new Date());
                const mine = Array.isArray(s?.scheduledByMe) ? s.scheduledByMe : [];
                const hosting = Array.isArray(s?.hostingInterviews) ? s.hostingInterviews : [];
                setInterviewsToday([...mine, ...hosting].filter((x) => x.scheduledDate === y).length);
              } catch {
                setInterviewsToday(0);
              }
            })();
          }}
        />
      )}

      {/* Screening Workflow Modal */}
      {showScreeningModal && selectedJob && (
        <ScreeningWorkflow
          candidates={candidates.map(c => ({ ...c, status: getCandidateStatus(selectedJob.title, c.name, c.status) }))}
          jobTitle={selectedJob.title}
          onStatusUpdate={updateCandidateStatus}
          onClose={() => setShowScreeningModal(false)}
        />
      )}

      {/* Email Modal */}
      {showEmailModal && activeCandidate && (
        <EmailModal
          candidate={activeCandidate}
          jobTitle={selectedJob?.title}
          senderName={recruiterName}
          onClose={() => { setShowEmailModal(false); setActiveCandidate(null); }}
        />
      )}

      {/* Scorecard Modal */}
      {showScorecardModal && activeCandidate && (
        <ScorecardModal
          candidate={activeCandidate}
          jobTitle={selectedJob?.title}
          initialScorecard={scorecards[`${selectedJob?.title}__${activeCandidate?.name}`] || null}
          onSave={(payload) => saveScorecard(selectedJob?.title, activeCandidate?.name, payload)}
          onClose={() => { setShowScorecardModal(false); setActiveCandidate(null); }}
        />
      )}

      {/* JD Modal */}
      <AnimatePresence>
        {showJDModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-foreground">Post New Job</h3>
                <button onClick={() => { setShowJDModal(false); setGeneratedJD(""); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 relative">
                <label className="text-xs text-muted-foreground mb-1.5 block">Job Title</label>
                <div className="relative">
                  <Input
                    value={newJobTitle}
                    onChange={e => { setNewJobTitle(e.target.value); setShowJobTitleDropdown(true); }}
                    onFocus={() => setShowJobTitleDropdown(true)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="bg-background/50 text-sm pr-8"
                  />
                  <button type="button" onClick={() => setShowJobTitleDropdown(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <AnimatePresence>
                  {showJobTitleDropdown && (
                    <>
                      <div className="fixed inset-0 z-[10]" onClick={() => setShowJobTitleDropdown(false)} />
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-xl z-[20] max-h-48 overflow-y-auto">
                        {JOB_TITLE_OPTIONS.filter(t => !newJobTitle || t.toLowerCase().includes(newJobTitle.toLowerCase())).map(title => (
                          <button key={title} type="button"
                            onClick={() => { setNewJobTitle(title); setShowJobTitleDropdown(false); }}
                            className="w-full text-left px-4 py-2.5 font-mono text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors border-b border-border/20 last:border-b-0">
                            {title}
                          </button>
                        ))}
                        {newJobTitle && !JOB_TITLE_OPTIONS.find(t => t.toLowerCase() === newJobTitle.toLowerCase()) && (
                          <button type="button"
                            onClick={() => setShowJobTitleDropdown(false)}
                            className="w-full text-left px-4 py-2.5 font-mono text-xs text-primary hover:bg-primary/10 transition-colors">
                            Use "{newJobTitle}"
                          </button>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1.5 block">Approved Salary Budget <span className="text-muted-foreground/50">(LPA, optional)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    value={recruiterBudget}
                    onChange={e => setRecruiterBudget(e.target.value)}
                    placeholder="e.g. 25"
                    className="bg-background/50 text-sm pl-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground/50">LPA</span>
                </div>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-1 bg-background/50 border border-border/40 rounded-xl p-1 mb-5">
                <button onClick={() => setJdMode("upload")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono transition-all ${jdMode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <Upload className="w-3.5 h-3.5" /> Upload JD
                </button>
                <button onClick={() => setJdMode("ai")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono transition-all ${jdMode === "ai" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <Sparkles className="w-3.5 h-3.5" /> AI Generate JD
                </button>
              </div>

              {jdMode === "upload" ? (
                <div className="space-y-3">
                  {/* Step 1: ONLY upload input + loader */}
                  {!jdExtracted && (
                    <>
                      <div
                        onClick={() => fileRef.current?.click()}
                        className="border-2 border-dashed border-primary/25 hover:border-primary/50 rounded-xl p-8 text-center cursor-pointer transition-all"
                      >
                        <input
                          ref={fileRef}
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => handleExtractJd(e.target.files?.[0])}
                        />
                        {jdFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="font-mono text-sm text-primary">{jdFile.name}</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-primary/40 mx-auto mb-2" />
                            <p className="font-mono text-xs text-muted-foreground">
                              Upload JD PDF to auto-fill the form
                            </p>
                            <p className="font-mono text-[10px] text-muted-foreground/40 mt-1">PDF only</p>
                          </>
                        )}
                      </div>

                      {extractingJd && (
                        <div className="flex items-center justify-center gap-2 font-mono text-xs text-muted-foreground">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </motion.span>
                          Extracting job post fields from PDF...
                        </div>
                      )}
                    </>
                  )}

                  {/* Step 2: extracted form (upload UI hidden) */}
                  {jdExtracted && !extractingJd && (
                    <div className="bg-background/60 border border-primary/20 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="font-mono text-[10px] uppercase tracking-wider text-green-400">Fields extracted</span>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-mono text-primary hover:underline"
                          onClick={() => fileRef.current?.click()}
                        >
                          Change PDF
                        </button>
                      </div>

                      {/* Keep the hidden input available for Change PDF */}
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => handleExtractJd(e.target.files?.[0])}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Job Title *</label>
                          <Input
                            value={jdExtracted.jobTitle}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, jobTitle: e.target.value })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Seniority *</label>
                          <Input
                            value={jdExtracted.seniority}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, seniority: e.target.value })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Role (optional)</label>
                          <Input
                            value={jdExtracted.role}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, role: e.target.value })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Employment type *</label>
                          <Input
                            value={jdExtracted.employmentType}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, employmentType: e.target.value })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Experience min (years) *</label>
                          <Input
                            value={jdExtracted.experienceMinYears}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, experienceMinYears: e.target.value })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Experience max (years) *</label>
                          <Input
                            value={jdExtracted.experienceMaxYears}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, experienceMaxYears: e.target.value })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Work arrangement *</label>
                          <Input
                            value={jdExtracted.workArrangement}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, workArrangement: e.target.value })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Salary currency</label>
                          <Input
                            value={jdExtracted.salary.currency}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, salary: { ...jdExtracted.salary, currency: e.target.value } })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Salary min</label>
                          <Input
                            value={jdExtracted.salary.min}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, salary: { ...jdExtracted.salary, min: e.target.value } })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Salary max</label>
                          <Input
                            value={jdExtracted.salary.max}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, salary: { ...jdExtracted.salary, max: e.target.value } })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Salary frequency</label>
                          <Input
                            value={jdExtracted.salary.frequency}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, salary: { ...jdExtracted.salary, frequency: e.target.value } })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Location country</label>
                          <Input
                            value={jdExtracted.locations.country}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, locations: { ...jdExtracted.locations, country: e.target.value } })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Location cities (comma separated)</label>
                          <Input
                            value={(jdExtracted.locations.cities || []).join(", ")}
                            onChange={(e) =>
                              setJdExtracted({
                                ...jdExtracted,
                                locations: {
                                  ...jdExtracted.locations,
                                  cities: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                                },
                              })
                            }
                            className="bg-background/50 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Job summary *</label>
                        <textarea
                          value={jdExtracted.jobSummary}
                          onChange={(e) => setJdExtracted({ ...jdExtracted, jobSummary: e.target.value })}
                          className="w-full h-24 bg-background/50 border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>

                      {[
                        { key: "responsibilities", label: "Responsibilities", value: jdExtracted.responsibilities },
                        { key: "perksAndBenefits", label: "Perks & benefits", value: jdExtracted.perksAndBenefits },
                        { key: "additionalRequirements", label: "Additional requirements", value: jdExtracted.additionalRequirements },
                      ].map((section) => (
                        <div key={section.key}>
                          <label className="text-xs text-muted-foreground mb-1.5 block">{section.label}</label>
                          <textarea
                            value={(section.value || []).join("\n")}
                            onChange={(e) =>
                              setJdExtracted({
                                ...jdExtracted,
                                [section.key]: e.target.value
                                  .split("\n")
                                  .map((s) => s.replace(/^[\-\•\*]\s*/, "").trim())
                                  .filter(Boolean),
                              })
                            }
                            className="w-full h-24 bg-background/50 border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                      ))}

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs text-muted-foreground block">Skills *</label>
                          <button
                            type="button"
                            className="text-xs font-mono text-primary hover:underline"
                            onClick={() =>
                              setJdExtracted({
                                ...jdExtracted,
                                skills: [...(jdExtracted.skills || []), { name: "", mandatory: false }],
                              })
                            }
                          >
                            + Add skill
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(jdExtracted.skills || []).map((s, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input
                                value={s.name}
                                onChange={(e) => {
                                  const next = [...jdExtracted.skills];
                                  next[idx] = { ...next[idx], name: e.target.value };
                                  setJdExtracted({ ...jdExtracted, skills: next });
                                }}
                                placeholder="e.g. ReactJS"
                                className="bg-background/50 text-sm flex-1"
                              />
                              <label className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={!!s.mandatory}
                                  onChange={(e) => {
                                    const next = [...jdExtracted.skills];
                                    next[idx] = { ...next[idx], mandatory: e.target.checked };
                                    setJdExtracted({ ...jdExtracted, skills: next });
                                  }}
                                />
                                Mandatory
                              </label>
                              <button
                                type="button"
                                className="p-2 rounded-md border border-border/40 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  const next = (jdExtracted.skills || []).filter((_, i) => i !== idx);
                                  setJdExtracted({ ...jdExtracted, skills: next });
                                }}
                                title="Remove"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Minimum Education Qualification</label>
                          <Input
                            value={jdExtracted.minimumEducationQualification}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, minimumEducationQualification: e.target.value })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Course / Specialization</label>
                          <Input
                            value={jdExtracted.courseOrSpecialization}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, courseOrSpecialization: e.target.value })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
                          <Input
                            value={jdExtracted.status}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, status: e.target.value })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Application deadline</label>
                          <Input
                            type="date"
                            value={jdExtracted.applicationDeadline}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, applicationDeadline: e.target.value })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Employment start date</label>
                          <Input
                            type="date"
                            value={jdExtracted.employmentStartDate}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, employmentStartDate: e.target.value })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Key callout</label>
                          <Input
                            value={jdExtracted.keyCallout}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, keyCallout: e.target.value })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Google Maps URL of office location</label>
                          <Input
                            value={jdExtracted.googleMapsOfficeLocationUrl}
                            onChange={(e) => setJdExtracted({ ...jdExtracted, googleMapsOfficeLocationUrl: e.target.value })}
                            className="bg-background/50 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Describe the role for AI</label>
                    <textarea
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      placeholder="e.g. Senior React Developer with 5 years experience, must know TypeScript and cloud platforms..."
                      className="w-full h-20 bg-background/50 border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateJD}
                    disabled={!aiPrompt.trim() || generatingJD}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                  >
                    {generatingJD ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw className="w-3.5 h-3.5" /></motion.span> Generating...</> : <><Sparkles className="w-3.5 h-3.5" /> Generate JD with AI</>}
                  </button>
                  {generatedJD && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-background/60 border border-primary/20 rounded-xl p-4 max-h-48 overflow-y-auto">
                      <div className="flex items-center gap-1.5 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span className="font-mono text-[10px] text-green-400 uppercase tracking-wider">JD Generated</span>
                      </div>
                      <pre className="font-sans text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{generatedJD}</pre>
                    </motion.div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handlePostJob}
                disabled={jdMode === "upload" ? (!jdFile || extractingJd || !jdExtracted?.jobTitle) : !generatedJD}
                className="w-full mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
              >
                <Briefcase className="w-4 h-4" /> Post Job
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}