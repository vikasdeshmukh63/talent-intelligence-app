import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ClipboardList, Star, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/client";

const CRITERIA = [
  { key: "technical", label: "Technical Skills" },
  { key: "communication", label: "Communication" },
  { key: "cultural_fit", label: "Cultural Fit" },
  { key: "leadership", label: "Leadership" },
  { key: "problem_solving", label: "Problem Solving" },
];

function StarRating({ value, onChange, loading }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onMouseEnter={() => !loading && setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => !loading && onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-4 h-4 transition-colors ${
              loading
                ? star <= value
                  ? "fill-amber-400 text-amber-400 animate-pulse"
                  : "text-muted-foreground/20"
                : star <= (hovered || value)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ScorecardModal({ candidate, jobTitle, onClose, onSave, initialScorecard = null }) {
  const [ratings, setRatings] = useState({ technical: 0, communication: 0, cultural_fit: 0, leadership: 0, problem_solving: 0 });
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatingRatings, setGeneratingRatings] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiRatingsNote, setAiRatingsNote] = useState("");

  // Load existing scorecard values when editing; otherwise auto-generate AI ratings.
  useEffect(() => {
    if (initialScorecard) {
      const existingRatings = initialScorecard.ratings || {};
      setRatings({
        technical: Number(existingRatings.technical || 0),
        communication: Number(existingRatings.communication || 0),
        cultural_fit: Number(existingRatings.cultural_fit || 0),
        leadership: Number(existingRatings.leadership || 0),
        problem_solving: Number(existingRatings.problem_solving || 0),
      });
      setNotes(String(initialScorecard.notes || ""));
      setSummary(String(initialScorecard.summary || ""));
      setAiRatingsNote("");
      return;
    }
    generateAIRatings();
  }, [initialScorecard]);

  const generateAIRatings = async () => {
    setGeneratingRatings(true);
    setAiRatingsNote("");
    const res = await apiClient.integrations.Core.InvokeLLM({
      prompt: `You are an expert AI recruiter. Based on the candidate profile below, suggest interview scorecard ratings from 1-5 for each criterion.

Candidate: ${candidate.name}
Role: ${jobTitle}
Skills: ${candidate.skills?.join(", ")}
AI Match Score: ${candidate.score}%
Current Status: ${candidate.status}

Rate each on a scale of 1–5 based on what the profile suggests:
- technical: technical skills alignment with the role
- communication: estimated communication ability for this seniority
- cultural_fit: likely cultural fit based on background
- leadership: leadership potential based on role level
- problem_solving: problem-solving aptitude inferred from skills and match

Also provide a one-line "rationale" explaining the ratings overall.

Return JSON only.`,
      response_json_schema: {
        type: "object",
        properties: {
          technical: { type: "number" },
          communication: { type: "number" },
          cultural_fit: { type: "number" },
          leadership: { type: "number" },
          problem_solving: { type: "number" },
          rationale: { type: "string" },
        },
      },
    });
    setRatings({
      technical: Math.round(res.technical),
      communication: Math.round(res.communication),
      cultural_fit: Math.round(res.cultural_fit),
      leadership: Math.round(res.leadership),
      problem_solving: Math.round(res.problem_solving),
    });
    setAiRatingsNote(res.rationale || "");
    setGeneratingRatings(false);
  };

  const setRating = (key, val) => setRatings(prev => ({ ...prev, [key]: val }));

  const generateSummary = async () => {
    setGenerating(true);
    const ratingLines = CRITERIA.map(c => `${c.label}: ${ratings[c.key]}/5`).join(", ");
    const res = await apiClient.integrations.Core.InvokeLLM({
      prompt: `You are an expert recruiter. Summarize this interview scorecard in 2-3 sentences for candidate ${candidate.name} applying for "${jobTitle}".
Ratings: ${ratingLines}.
Interviewer notes: "${notes || "No notes provided"}".
Be concise and professional.`,
    });
    setSummary(res);
    setGenerating(false);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ratings,
        notes,
        summary,
        overallScore: avg ? Number(avg) : null,
        updatedAt: new Date().toISOString(),
      });
    }
    setSaved(true);
    setTimeout(() => onClose(), 1500);
  };

  const avgScore = Object.values(ratings).filter(v => v > 0);
  const avg = avgScore.length ? (avgScore.reduce((a, b) => a + b, 0) / avgScore.length).toFixed(1) : null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
        onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md bg-card border border-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" /> Interview Scorecard
              </h3>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{candidate?.name} · {jobTitle}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {saved ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-8 gap-3">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <p className="font-semibold text-foreground">Scorecard Saved!</p>
            </motion.div>
          ) : (
            <>
              {/* AI Ratings Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary/70" />
                  <span className="font-mono text-[10px] text-primary/70 uppercase tracking-wider">
                    {generatingRatings ? "AI Generating Ratings..." : "AI-Suggested Ratings"}
                  </span>
                </div>
                <button
                  onClick={generateAIRatings}
                  disabled={generatingRatings}
                  className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors"
                >
                  <motion.span animate={generatingRatings ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 1, repeat: generatingRatings ? Infinity : 0, ease: "linear" }}>
                    <RefreshCw className="w-3 h-3" />
                  </motion.span>
                  Regenerate
                </button>
              </div>

              <p className="font-mono text-[9px] text-muted-foreground/50 mb-3">Based on candidate profile · skills · AI match score</p>

              {/* Ratings */}
              <div className="space-y-3 mb-4 bg-primary/5 border border-primary/10 rounded-xl p-4">
                {CRITERIA.map(c => (
                  <div key={c.key} className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-muted-foreground">{c.label}</span>
                    <StarRating value={ratings[c.key]} onChange={val => setRating(c.key, val)} loading={generatingRatings} />
                  </div>
                ))}
              </div>

              {/* AI Rationale */}
              {aiRatingsNote && !generatingRatings && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 mb-4">
                  <Sparkles className="w-3 h-3 text-primary/60 flex-shrink-0 mt-0.5" />
                  <p className="font-sans text-[10px] text-muted-foreground/80 leading-relaxed italic">{aiRatingsNote}</p>
                </motion.div>
              )}

              {/* Average */}
              {avg && (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 mb-4">
                  <span className="font-mono text-[11px] text-muted-foreground">Overall Score</span>
                  <span className="font-mono text-sm font-bold text-primary">{avg} / 5</span>
                </div>
              )}

              {/* Notes */}
              <div className="mb-4">
                <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Interviewer Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add your observations about the candidate..."
                  className="w-full h-20 bg-background/60 border border-border/50 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* AI Summary */}
              <Button onClick={generateSummary} disabled={generating || !avgScore.length} size="sm"
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 mb-3 gap-2 text-xs">
                {generating
                  ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw className="w-3.5 h-3.5" /></motion.span> Generating summary...</>
                  : <><Sparkles className="w-3.5 h-3.5" /> Auto-summarize with AI</>}
              </Button>

              {summary && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-primary/70 flex-shrink-0 mt-0.5" />
                  <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">{summary}</p>
                </motion.div>
              )}

              <Button onClick={handleSave} disabled={!avgScore.length}
                className="w-full bg-primary hover:bg-primary/90 gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Save Scorecard
              </Button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}