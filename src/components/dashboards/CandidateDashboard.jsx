import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Upload, Sparkles, FileText, RefreshCw, X, User, Mail, Phone, MapPin, Briefcase, CheckCircle2, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/api/client";
import { Input } from "@/components/ui/input";
import { leadStore } from "@/lib/leadStore";
import { useTheme } from "@/lib/ThemeContext";
import {
  NO_OPEN_JOBS_MESSAGE,
  buildResumeJobMatchPrompt,
  formatOpenJobsForPrompt,
  normalizeResumeJobMatch,
  resumeJobMatchJsonSchema,
} from "@/lib/resumeJobMatch";
import ApplicationPipelineGantt from "@/components/shared/ApplicationPipelineGantt.jsx";

const ESDS_LOGO = "/vite.svg";
const COLORS = ["#00B4D8", "#34d399", "#f59e0b", "#f87171", "#818cf8"];

export default function CandidateDashboard({ candidate, onLogout, onProfileUpdate }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [file, setFile] = useState(null);
  const [savedFileUrl, setSavedFileUrl] = useState(null);
  const [savedFileName, setSavedFileName] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const resumeStorageKey = `resume_${candidate.email}`;
  const resumeMatchesStorageKey = `resume_matches_${candidate.email}`;
  const resumeListStorageKey = `resumes_${candidate.email}`;
  const selectedResume = useMemo(
    () => resumes.find((r) => r.id === selectedResumeId) || null,
    [resumes, selectedResumeId]
  );
  const [editData, setEditData] = useState({
    name: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    location: candidate.location,
  });
  const [myApplications, setMyApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const refreshMyApplications = useCallback(async () => {
    try {
      setApplicationsLoading(true);
      const { applications } = await apiClient.applications.listMine();
      setMyApplications(Array.isArray(applications) ? applications : []);
    } catch (_err) {
      setMyApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMyApplications();
  }, [refreshMyApplications]);

  const saveResumes = (next) => {
    setResumes(next);
    localStorage.setItem(resumeListStorageKey, JSON.stringify(next));
  };

  const selectResume = (resume) => {
    if (!resume) return;
    setSelectedResumeId(resume.id);
    setSavedFileUrl(resume.url);
    setSavedFileName(resume.name);
    setResults(resume.results || null);
  };

  const runMatching = async (resumeRecord) => {
    if (!resumeRecord?.url) return;
    setLoading(true);
    try {
      const { jobs } = await apiClient.jobs.listOpen();
      let response;
      if (!jobs.length) {
        response = {
          no_match: true,
          message: NO_OPEN_JOBS_MESSAGE,
          profiles: [],
          candidate_name: "",
          summary: "",
        };
      } else {
        const prompt = buildResumeJobMatchPrompt(formatOpenJobsForPrompt(jobs));
        const raw = await apiClient.integrations.Core.InvokeLLM({
          prompt,
          file_urls: [resumeRecord.url],
          response_json_schema: resumeJobMatchJsonSchema,
        });
        response = normalizeResumeJobMatch(raw, jobs, {
          none: "No strong match among current openings right now. Please check back later — new roles are added regularly.",
        });
      }

      setResults(response);
      setResumes((prev) => {
        const exists = prev.some((r) => r.id === resumeRecord.id);
        const next = exists
          ? prev.map((r) =>
              r.id === resumeRecord.id ? { ...r, results: response } : r
            )
          : [{ ...resumeRecord, results: response }, ...prev];
        localStorage.setItem(resumeListStorageKey, JSON.stringify(next));
        return next;
      });
      if (!response.no_match && response.profiles?.length) {
        leadStore.addLead({
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          location: candidate.location,
          topMatch: response.profiles[0]?.title || "—",
          aiScore: response.profiles[0]?.match ?? "—",
          resumeUrl: resumeRecord.url,
        });
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to match this resume with open jobs.");
    }
    setLoading(false);
  };

  const handleFile = async (f) => {
    if (!f) return;
    setFile(f);
    setLoading(true);
    try {
      const { file_url } = await apiClient.integrations.Core.UploadFile({ file: f });
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `resume-${Date.now()}-${Math.random()}`;
      const resumeRecord = {
        id,
        url: file_url,
        name: f.name,
        uploadedAt: new Date().toISOString(),
        results: null,
      };
      setResumes((prev) => {
        const next = [resumeRecord, ...prev];
        localStorage.setItem(resumeListStorageKey, JSON.stringify(next));
        return next;
      });
      setSelectedResumeId(id);
      setSavedFileUrl(file_url);
      setSavedFileName(f.name);
      setResults(null);
      localStorage.setItem(resumeStorageKey, JSON.stringify({ url: file_url, name: f.name }));
      await runMatching(resumeRecord);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to upload resume.");
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setFile(null);
    setResults(null);
  };

  React.useEffect(() => {
    // Load all saved resumes from localStorage on mount
    const savedResumes = localStorage.getItem(resumeListStorageKey);
    if (savedResumes) {
      try {
        const parsed = JSON.parse(savedResumes);
        if (Array.isArray(parsed) && parsed.length) {
          setResumes(parsed);
          const first = parsed[0];
          setSelectedResumeId(first.id);
          setSavedFileUrl(first.url);
          setSavedFileName(first.name);
          setResults(first.results || null);
          return;
        }
      } catch (err) {
        console.error("Error loading saved resumes:", err);
      }
    }
    // Backward compatibility for older single-resume storage
    const savedResume = localStorage.getItem(resumeStorageKey);
    if (savedResume) {
      try {
        const { url, name } = JSON.parse(savedResume);
        const fallbackResume = {
          id: "legacy-resume",
          url,
          name: name || "Resume",
          uploadedAt: new Date().toISOString(),
          results: null,
        };
        const savedMatches = localStorage.getItem(resumeMatchesStorageKey);
        if (savedMatches) {
          try {
            fallbackResume.results = JSON.parse(savedMatches);
          } catch (_err) {
            // ignore invalid cached match data
          }
        }
        saveResumes([fallbackResume]);
        selectResume(fallbackResume);
      } catch (err) {
        console.error("Error loading saved resume:", err);
      }
    }
  }, [resumeStorageKey, resumeMatchesStorageKey, resumeListStorageKey]);

  const handleApply = async (position) => {
    try {
      const { jobs } = await apiClient.jobs.listOpen();
      const job = (jobs || []).find((j) => j.title === position.title);
      if (!job?.id) {
        alert("This position is no longer available. Please check back later.");
        return;
      }
      await apiClient.applications.apply({
        jobId: job.id,
        aiScore: position.match,
        skills: position.skills,
        resumeFileUrl: savedFileUrl || null,
      });
      await apiClient.integrations.Core.SendEmail({
        to: "priya.mehta@esds.co.in",
        subject: `New Application: ${candidate.name} for ${position.title}`,
        body: `Candidate ${candidate.name} (${candidate.email}) has applied for the position of ${position.title}.\n\nAI Match Score: ${position.match}%\n\nTop Skills: ${position.skills.join(", ")}\n\nPlease review and take appropriate action.`
      });
      alert(`Applied for ${position.title}! Recruiter has been notified.`);
      refreshMyApplications();
    } catch (err) {
      console.error("Error sending notification:", err);
      alert(err?.message || "Failed to apply. Please try again.");
    }
  };

  const handleDeleteResume = async () => {
    if (!selectedResume?.url) return;
    const confirmed = window.confirm("Are you sure you want to delete this resume?");
    if (!confirmed) return;
    try {
      await apiClient.integrations.Core.DeleteFile({ file_url: selectedResume.url });
      const remaining = resumes.filter((r) => r.id !== selectedResume.id);
      saveResumes(remaining);
      setFile(null);
      if (remaining.length) {
        selectResume(remaining[0]);
      } else {
        setSelectedResumeId(null);
        setSavedFileUrl(null);
        setSavedFileName(null);
        setResults(null);
      }
    } catch (err) {
      console.error("Error deleting resume:", err);
      alert("Failed to delete resume. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-background overflow-y-auto">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(hsl(190,90%,50%) 1px, transparent 1px), linear-gradient(90deg, hsl(190,90%,50%) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={ESDS_LOGO} alt="ESDS" className="w-10 h-10 object-contain" />
          <div>
            <div className={`font-semibold text-sm text-foreground ${!isDark ? 'font-bold' : ''}`}>{candidate.name}</div>
            <div className={`font-mono text-[10px] uppercase tracking-wider ${isDark ? "text-white" : "text-#003d82 font-bold"}`} style={{ color: !isDark ? "#003d82" : undefined }}>Candidate · eNlight Talent</div>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-mono transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Summary */}
        <div className={`bg-card/50 rounded-xl p-5 mb-8 border-2 ${theme === 'dark' ? 'border-blue-900/40' : 'border-blue-900/40'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <User className="w-4 h-4" style={{ color: "#00B4D8" }} /> Your Profile
            </h3>
            <button
              onClick={() => {
                if (editMode) {
                  setEditData({ name: candidate.name, email: candidate.email, phone: candidate.phone, location: candidate.location });
                }
                setEditMode(!editMode);
              }}
              className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all"
              style={{ border: "1px solid #003d82", color: isDark ? "#00B4D8" : "#003d82", backgroundColor: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? "rgba(0,180,216,0.1)" : "rgba(0,61,130,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {editMode ? "Cancel" : "Edit"}
            </button>
          </div>
          {editMode ? (
            <div className="space-y-3">
              {[
                { label: "Name", key: "name", icon: <User className="w-3.5 h-3.5" /> },
                { label: "Email", key: "email", icon: <Mail className="w-3.5 h-3.5" /> },
                { label: "Phone", key: "phone", icon: <Phone className="w-3.5 h-3.5" /> },
                { label: "Location", key: "location", icon: <MapPin className="w-3.5 h-3.5" /> },
              ].map((f) => (
                <div key={f.key}>
                  <label className="flex items-center gap-1.5 mb-1"><span style={{ color: "#00B4D8" }}>{f.icon}</span><span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{f.label}</span></label>
                  <Input
                    value={editData[f.key] || ""}
                    onChange={(e) => setEditData({ ...editData, [f.key]: e.target.value })}
                    className="bg-background/40 text-xs"
                  />
                </div>
              ))}
              <button
                onClick={async () => {
                  try {
                    setSavingProfile(true);
                    const updatedUser = await apiClient.auth.updateProfile({
                      name: editData.name,
                      phone: editData.phone,
                      location: editData.location,
                    });
                    setEditData({
                      name: updatedUser?.name || "",
                      email: updatedUser?.email || candidate.email || "",
                      phone: updatedUser?.phone || "",
                      location: updatedUser?.location || "",
                    });
                    if (onProfileUpdate) onProfileUpdate(updatedUser);
                    setEditMode(false);
                  } catch (error) {
                    console.error("Profile update failed:", error);
                    alert(error.message || "Failed to update profile. Please try again.");
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                disabled={savingProfile}
                className="w-full mt-4 text-xs font-mono px-3 py-1.5 rounded-lg text-white transition-all"
                style={{ backgroundColor: "#003d82" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,61,130,0.85)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#003d82")}
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <User className="w-3.5 h-3.5" />, label: "Name", value: editData.name },
                { icon: <Mail className="w-3.5 h-3.5" />, label: "Email", value: editData.email },
                { icon: <Phone className="w-3.5 h-3.5" />, label: "Phone", value: editData.phone },
                { icon: <MapPin className="w-3.5 h-3.5" />, label: "Location", value: editData.location },
              ].map((f, i) => (
                <div key={i} className="bg-background/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1"><span style={{ color: "#00B4D8" }}>{f.icon}</span><span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{f.label}</span></div>
                  <div className="font-semibold text-xs text-foreground truncate">{f.value || "—"}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Application pipeline (Gantt-style) */}
        <div className={`bg-card/50 rounded-xl p-5 mb-8 border-2 ${theme === "dark" ? "border-blue-900/40" : "border-blue-900/40"}`}>
          <h3 className="font-semibold text-sm text-foreground mb-1 flex items-center gap-2">
            <Briefcase className="w-4 h-4" style={{ color: "#00B4D8" }} /> Your applications
          </h3>
          <p className="font-mono text-[10px] text-muted-foreground mb-4">
            Track where each application sits in the hiring pipeline and how long it has been in process.
          </p>
          {applicationsLoading ? (
            <p className="font-mono text-xs text-muted-foreground">Loading applications…</p>
          ) : myApplications.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">
              You have not applied to any roles yet. When you apply from job matches, your progress will appear here.
            </p>
          ) : (
            <div className="space-y-4">
              {myApplications.map((app) => (
                <div key={app.id} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-foreground">{app.jobTitle}</span>
                    {typeof app.aiScore === "number" ? (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        AI match when applied: <span className="text-foreground font-bold">{app.aiScore}%</span>
                      </span>
                    ) : null}
                  </div>
                  <ApplicationPipelineGantt
                    status={app.status}
                    appliedAt={app.appliedAt}
                    updatedAt={app.updatedAt}
                    jobTitle={app.jobTitle}
                    compact={false}
                    theme={isDark ? "dark" : "light"}
                  />
                  {app.jobOpen && app.jobId ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/jobs/${app.jobId}`)}
                      className="font-mono text-[10px] text-primary hover:underline"
                    >
                      View job post
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Resume */}
        {resumes.length > 0 && (
          <div className={`bg-card/50 rounded-xl p-5 mb-6 border-2 ${theme === 'dark' ? 'border-blue-900/40' : 'border-blue-900/40'}`}>
            <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: "#00B4D8" }} /> Saved Resumes
            </h3>
            <div className="space-y-2">
              {resumes.map((resume) => (
                <button
                  key={resume.id}
                  onClick={() => selectResume(resume)}
                  className="w-full flex items-center justify-between bg-background/40 rounded-lg p-3 border text-left transition-all"
                  style={{
                    borderColor:
                      selectedResumeId === resume.id
                        ? "rgba(0,180,216,0.5)"
                        : "rgba(0,61,130,0.2)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5" style={{ color: "#003d82" }} />
                    <div>
                      <div className="font-mono text-xs text-foreground">{resume.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {resume.results ? "Matched" : "Not analyzed yet"}
                      </div>
                    </div>
                  </div>
                  {selectedResumeId === resume.id && (
                    <span className="font-mono text-[10px]" style={{ color: "#00B4D8" }}>
                      Selected
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => selectedResume && runMatching(selectedResume)}
                disabled={!selectedResume || loading}
                className="px-3 py-1.5 rounded-lg border border-border/40 text-xs font-mono text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Search Matching Jobs
              </button>
              <div className="flex items-center justify-between bg-background/40 rounded-lg p-3 flex-1">
                <div className="font-mono text-xs text-foreground truncate">
                  {savedFileName || "No resume selected"}
                </div>
              </div>
              <button
                onClick={handleDeleteResume}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Resume Upload & AI Analysis */}
        <div className={`bg-card/50 rounded-xl p-5 border-2 ${theme === 'dark' ? 'border-blue-900/40' : 'border-blue-900/40'}`}>
          <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: theme === 'dark' ? "#ffffff" : "#00B4D8" }} /> Upload Resume & View Job Matches
          </h3>

          <AnimatePresence mode="wait">
            {!results ? (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
                  style={{ borderColor: dragging ? "#00B4D8" : file ? "rgba(0,180,216,0.6)" : "rgba(0,180,216,0.25)", background: dragging ? "rgba(0,180,216,0.06)" : "transparent" }}
                >
                  <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                       <FileText className="w-5 h-5" style={{ color: "#00B4D8" }} />
                       <span className="font-mono text-xs" style={{ color: "#00B4D8" }}>{file.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); reset(); }} className="text-muted-foreground hover:text-foreground ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                       <Upload className="w-8 h-8" style={{ color: "rgba(0,180,216,0.4)" }} />
                       <p className="font-mono text-xs text-foreground">Drop your resume here or <span style={{ color: "#00B4D8", fontWeight: "bold" }}>browse</span></p>
                      <p className="font-mono text-[9px] text-muted-foreground">PDF, DOC, DOCX</p>
                    </div>
                  )}
                </div>

                {loading && (
                   <div className="flex items-center justify-center gap-2 mt-6 font-mono text-xs" style={{ color: isDark ? "#ffffff" : "#003d82" }}>
                     <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                       <Sparkles className="w-4 h-4" style={{ color: isDark ? "#ffffff" : "#003d82" }} />
                     </motion.span>
                     AI Analyzing Resume...
                   </div>
                 )}
              </motion.div>
            ) : (
              <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "#003d82", fontWeight: "bold" }}>AI Analysis Complete</p>
                    {results.no_match || !results.profiles?.length ? (
                      <p className="font-semibold text-sm text-foreground mt-0.5">Open roles vs your resume</p>
                    ) : (
                      results.candidate_name && (
                        <p className="font-semibold text-sm text-foreground mt-0.5">
                          Best matches for <span style={{ color: "#003d82" }}>{results.candidate_name}</span>
                        </p>
                      )
                    )}
                  </div>
                  <button onClick={reset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground text-xs font-mono transition-all">
                    <RotateCcw className="w-3 h-3" /> Upload New
                  </button>
                </div>

                {(results.no_match || !results.profiles?.length) && (
                  <div
                    className="rounded-xl border p-6 mb-4 text-center"
                    style={{
                      borderColor: isDark ? "rgba(0,180,216,0.25)" : "rgba(0,61,130,0.2)",
                      background: isDark ? "rgba(0,180,216,0.04)" : "rgba(0,61,130,0.04)",
                    }}
                  >
                    <p className="text-sm text-foreground font-medium mb-1">No matching role right now</p>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                      {results.message ||
                        "We couldn’t match you to a current opening. Please check back later — recruiters add new positions often."}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.profiles?.map((p, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className="bg-background/50 border rounded-xl p-4 transition-all"
                       style={{ borderColor: i === 0 ? "rgba(0,180,216,0.5)" : "hsl(214,30%,18%)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                           <Briefcase className="w-3.5 h-3.5" style={{ color: "rgba(0,180,216,0.6)" }} />
                           <span className="font-semibold text-xs text-foreground">{p.title}</span>
                         </div>
                         <span className="font-mono text-sm font-bold" style={{ color: "#003d82" }} >{p.match}%</span>
                      </div>
                      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden mb-3">
                        <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${p.match}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 + 0.2 }}
                          style={{ background: isDark ? `linear-gradient(90deg, #003d82, #00B4D8)` : `linear-gradient(90deg, #1b5e20, #4caf50)` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{p.reason}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {p.skills?.map(s => (
                           <span key={s} className="font-mono text-[9px] px-1.5 py-0.5 rounded-full" style={{ border: isDark ? "1px solid rgba(0,180,216,0.2)" : "1px solid rgba(0,61,130,0.2)", color: isDark ? "rgba(0,180,216,0.7)" : "rgba(0,61,130,0.7)", backgroundColor: isDark ? "rgba(0,180,216,0.05)" : "rgba(0,61,130,0.05)" }}>{s}</span>
                         ))}
                      </div>
                      <button
                        onClick={() => handleApply(p)}
                        className="w-full py-1.5 rounded-lg font-mono text-xs transition-all"
                        style={{ color: "#ffffff", backgroundColor: isDark ? "hsl(220,80%,30%)" : "#003d82", border: isDark ? "1px solid hsl(220,80%,30%)" : "1px solid #003d82" }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      >
                        Apply for Position
                      </button>
                      {p.job_id ? (
                        <button
                          onClick={() =>
                            navigate(`/jobs/${p.job_id}`, {
                              state: {
                                aiScore: p.match,
                                matchedSkills: Array.isArray(p.skills) ? p.skills : [],
                              },
                            })
                          }
                          className="w-full mt-2 py-1.5 rounded-lg font-mono text-xs transition-all border border-border/40 text-muted-foreground hover:text-foreground"
                        >
                          View Job
                        </button>
                      ) : null}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}