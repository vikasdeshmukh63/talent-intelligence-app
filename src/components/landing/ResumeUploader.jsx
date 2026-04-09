import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/api/client";
import { Upload, FileText, Sparkles, X, RotateCcw } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useNavigate } from "react-router-dom";
import {
  NO_OPEN_JOBS_MESSAGE,
  buildResumeJobMatchPrompt,
  formatOpenJobsForPrompt,
  normalizeResumeJobMatch,
  resumeJobMatchJsonSchema,
} from "@/lib/resumeJobMatch";

export default function ResumeUploader({ onResultsChange }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const pickerLockRef = useRef(false);

  const ensureCandidateAuth = async () => {
    try {
      const user = await apiClient.auth.me();
      if (user && user.role === "candidate") return true;
    } catch {
      apiClient.auth.logout();
    }
    setAuthMessage("Please login as candidate to upload and analyze your resume.");
    setTimeout(() => navigate("/auth/candidate"), 300);
    return false;
  };

  const handleUploadAreaClick = async () => {
    if (pickerLockRef.current) return;
    const isAuthenticated = await ensureCandidateAuth();
    const inputEl = document.getElementById("resume-file-input");
    if (isAuthenticated && inputEl) {
      pickerLockRef.current = true;
      inputEl.click();
      setTimeout(() => {
        pickerLockRef.current = false;
      }, 500);
    }
  };

  const handleFile = async (f) => {
    if (!f) return;
    const isAuthenticated = await ensureCandidateAuth();
    if (!isAuthenticated) {
      return;
    }
    setAuthMessage("");
    setFile(f);
    setResults(null);
    setTimeout(() => handleAnalyzeFile(f), 100);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) await handleFile(f);
  };

  const handleAnalyzeFile = async (f) => {
    if (!f) return;
    setLoading(true);
    setResults(null);
    try {
      const { file_url } = await apiClient.integrations.Core.UploadFile({ file: f });

      const { jobs } = await apiClient.jobs.listOpen();
      if (!jobs.length) {
        setResults({
          no_match: true,
          message: NO_OPEN_JOBS_MESSAGE,
          profiles: [],
          candidate_name: "",
          summary: "",
        });
        setLoading(false);
        return;
      }

      const prompt = buildResumeJobMatchPrompt(formatOpenJobsForPrompt(jobs));
      const raw = await apiClient.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        response_json_schema: resumeJobMatchJsonSchema,
      });
      const response = normalizeResumeJobMatch(raw, jobs, {
        none: "No strong match among current openings right now. Please check back later — new roles are added regularly.",
      });

      setResults(response);
      onResultsChange?.(response);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const reset = () => {
    setFile(null);
    setResults(null);
    onResultsChange?.(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!results ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Drop zone */}
             <div
              onClick={handleUploadAreaClick}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className="w-full cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-6 text-center"
              style={{
                borderColor: dragging ? "hsl(190,90%,50%)" : file ? "hsl(190,90%,50%,0.6)" : theme === 'light' ? "#003d82" : "hsl(190,90%,50%,0.25)",
                background: dragging ? "hsl(190,90%,50%,0.06)" : theme === 'light' ? "rgba(0,61,130,0.04)" : "hsl(214,50%,8%,0.7)",
                boxShadow: dragging ? "0 0 30px hsl(190,90%,50%,0.15)" : "none",
              }}
            >
              <input
                id="resume-file-input"
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  pickerLockRef.current = false;
                  handleFile(e.target.files[0]);
                }}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5" style={{ color: theme === 'light' ? "#003d82" : "hsl(190,90%,50%)" }} />
                    <span className="font-mono text-xs" style={{ color: theme === 'light' ? "#003d82" : "#ffffff" }}>{file.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="text-muted-foreground hover:text-foreground ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-7 h-7" style={{ color: theme === 'light' ? "rgba(0,61,130,0.3)" : "hsl(190,90%,50%,0.4)" }} />
                  <div>
                    <p className="font-mono text-xs font-bold" style={{ color: theme === 'light' ? "#000000" : "hsl(210,40%,98%)" }}>
                      Drop your resume here or{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUploadAreaClick();
                        }}
                        style={{ color: theme === 'light' ? "#003d82" : "hsl(190,90%,50%)", fontWeight: 700 }}
                        className="underline-offset-2 hover:underline"
                      >
                        browse
                      </button>
                    </p>
                    <p className="font-mono text-[9px] mt-0.5 font-bold" style={{ color: theme === 'light' ? "rgba(0,61,130,0.5)" : "hsl(210,20%,60%)" }}>PDF, DOC, DOCX</p>
                  </div>
                </div>
              )}
            </div>

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-center gap-2 font-mono text-xs" style={{ color: theme === 'light' ? "#003d82" : "hsl(190,90%,50%)" }}>
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Sparkles className="w-4 h-4" style={{ color: theme === 'light' ? "#003d82" : "hsl(190,90%,50%)" }} />
                </motion.span>
                AI Analyzing Resume...
              </div>
            )}
            {authMessage && <p className="text-xs text-red-400">{authMessage}</p>}
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="text-center mb-8">
              <h2 className={`font-display font-bold mb-3 ${theme === 'light' ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}`}>
                <span style={{ color: "#2ea8d8", fontWeight: 900 }}>ESDS</span>
                <br />
                <span style={{ color: theme === 'light' ? "#003d82" : "#ffffff", fontWeight: theme === 'light' ? 900 : 900 }}>eNlight <span style={{ color: "#2ea8d8", fontWeight: theme === 'light' ? 900 : 900 }}>Talent</span></span>
              </h2>
              <p className="font-mono text-[11px] tracking-widest uppercase mb-3 font-bold" style={{ color: theme === 'light' ? "#003d82" : "rgba(255,255,255,0.9)" }}>AI Analysis Complete</p>
              {results.no_match || !results.profiles?.length ? (
                <p className="text-sm md:text-base" style={{ color: theme === 'light' ? "#003d82" : "#ffffff", fontWeight: theme === 'light' ? 600 : 400 }}>
                  Open roles vs your resume
                </p>
              ) : (
                results.candidate_name && (
                  <p className="text-sm md:text-base" style={{ color: theme === 'light' ? "#003d82" : "#ffffff", fontWeight: theme === 'light' ? 700 : 400 }}>
                    Best matches for <span style={{ color: theme === 'light' ? "#003d82" : "#ffffff", fontWeight: theme === 'light' ? 800 : 400 }}>{results.candidate_name}</span>
                  </p>
                )
              )}
            </div>

            <button
              onClick={reset}
              className="mb-6 px-4 py-2 font-mono text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              style={theme === 'light'
                ? { background: "#ffffff", color: "#003d82", border: "1px solid #003d82" }
                : { background: "transparent", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.4)" }
              }
            >
              <RotateCcw className="w-4 h-4" style={{ color: theme === 'light' ? "#003d82" : "hsl(var(--primary))" }} />
              Upload Another Resume
            </button>

            {(results.no_match || !results.profiles?.length) && (
              <div
                className="rounded-xl border p-6 mb-6 text-center max-w-lg mx-auto"
                style={
                  theme === "light"
                    ? { borderColor: "rgba(0,61,130,0.2)", background: "rgba(0,61,130,0.04)" }
                    : { borderColor: "hsl(190,90%,50%,0.25)", background: "hsl(190,90%,50%,0.06)" }
                }
              >
                <p className="text-sm font-semibold mb-1" style={{ color: theme === "light" ? "#003d82" : "#e8f4ff" }}>
                  No matching role right now
                </p>
                <p className="text-xs leading-relaxed" style={{ color: theme === "light" ? "#555" : "hsl(210,25%,70%)" }}>
                  {results.message ||
                    "We couldn’t match you to a current opening. Please check back later — recruiters add new positions often."}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.profiles?.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="backdrop-blur rounded-xl p-3 transition-all duration-200"
                  style={
                    theme === 'light'
                      ? i === 0
                        ? { background: "#ffffff", border: "2px solid #003d82", boxShadow: "0 4px 20px rgba(0,61,130,0.15)" }
                        : { background: "#ffffff", border: "1px solid #e0eaf5", boxShadow: "0 2px 10px rgba(0,61,130,0.06)" }
                      : i === 0
                        ? { background: "hsl(214,45%,11%)", border: "1.5px solid hsl(190,90%,50%)", boxShadow: "0 0 24px hsl(190,90%,50%,0.18)" }
                        : { background: "hsl(214,40%,9%)", border: "1px solid hsl(190,90%,50%,0.2)", boxShadow: "0 2px 12px hsl(190,90%,50%,0.06)" }
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm" style={{ color: theme === 'light' ? "#003d82" : "#e8f4ff" }}>{p.title}</span>
                    <span className="font-mono text-sm font-bold" style={{ color: theme === 'light' ? "#003d82" : "#2ea8d8" }}>{p.match}%</span>
                  </div>
                  {/* Match bar */}
                  <div className="h-1 rounded-full mb-2 overflow-hidden" style={{ background: theme === 'light' ? "rgba(0,61,130,0.1)" : "hsl(var(--muted)/0.3)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${p.match}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 + 0.2 }}
                      style={{ background: theme === 'light' ? "linear-gradient(90deg, #1b5e20, #4caf50)" : "linear-gradient(90deg, hsl(190,90%,40%), hsl(190,90%,60%))" }}
                    />
                  </div>
                  <p className="text-[10px] mb-2 line-clamp-2" style={{ color: theme === 'light' ? "#555" : "hsl(210,25%,65%)" }}>{p.reason}</p>
                  <div className="flex flex-wrap gap-1">
                    {p.skills?.slice(0, 2).map((s) => (
                      <span key={s} className={`font-mono px-2 py-0.5 rounded-full ${theme === 'light' ? 'text-[11px]' : 'text-[11px]'}`}
                        style={theme === 'light'
                          ? { border: "1px solid rgba(0,61,130,0.3)", color: "#003d82", background: "rgba(0,61,130,0.06)" }
                          : { border: "1px solid hsl(190,90%,50%,0.35)", color: "hsl(190,90%,65%)", background: "hsl(190,90%,50%,0.08)" }
                        }>
                        {s}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>


          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}