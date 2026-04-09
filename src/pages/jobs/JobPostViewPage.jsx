import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiClient } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { Briefcase, MapPin, Share2, Star, X } from "lucide-react";

function linesFromBlock(text) {
  return (text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^•\s*/, ""));
}

function formatInrLpaRange(min, max) {
  const minN = Number(String(min || "").replace(/,/g, ""));
  const maxN = Number(String(max || "").replace(/,/g, ""));
  if (!Number.isFinite(minN) || !Number.isFinite(maxN) || minN <= 0 || maxN <= 0) return "";
  const toLpa = (n) => Math.round((n / 100000) * 10) / 10;
  return `${toLpa(minN)} - ${toLpa(maxN)} LPA`;
}

export default function JobPostViewPage() {
  const { user } = useAuth();
  const isCandidate = user?.role === "candidate";
  const isRecruiter = user?.role === "recruiter";
  const location = useLocation();
  const matchMeta = location?.state || {};
  const navigate = useNavigate();
  const { id } = useParams();
  const jobId = Number(id);
  const [state, setState] = useState({ loading: true, job: null, error: null });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const payload = isRecruiter
          ? await apiClient.recruiter.getJob(jobId)
          : await apiClient.jobs.getById(jobId);
        const { job } = payload || {};
        if (!mounted) return;
        setState({ loading: false, job, error: null });
      } catch (e) {
        if (!mounted) return;
        setState({ loading: false, job: null, error: e?.message || "Failed to load job." });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [jobId, isRecruiter]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const draft = useMemo(() => state.job?.details || null, [state.job]);
  const lpa = useMemo(() => (draft ? formatInrLpaRange(draft.salaryMin, draft.salaryMax) : ""), [draft]);
  const expLabel = useMemo(() => (draft?.experienceMin && draft?.experienceMax ? `${draft.experienceMin}-${draft.experienceMax} years experience` : ""), [draft]);
  const mandatorySkills = useMemo(() => (draft?.skills || []).filter((s) => s.mandatory).map((s) => s.name), [draft]);
  const preferredSkills = useMemo(() => (draft?.skills || []).filter((s) => !s.mandatory).map((s) => s.name), [draft]);
  const responsibilityLines = useMemo(() => linesFromBlock(draft?.responsibilities), [draft]);
  const perksLines = useMemo(() => linesFromBlock(draft?.perks), [draft]);
  const addReqLines = useMemo(() => linesFromBlock(draft?.additionalRequirements), [draft]);
  const [applying, setApplying] = useState(false);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState("");
  const [savedResumes, setSavedResumes] = useState([]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    if (!jobId || !Number.isFinite(jobId)) return null;
    return `${window.location.origin}/jobs/${jobId}`;
  }, [jobId]);

  const handleShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast("Link copied! Candidates can use this URL to view and apply.");
    } catch {
      setToast("Could not copy link.");
    }
  };

  useEffect(() => {
    if (!isCandidate || !user?.email) return;
    const stored = localStorage.getItem(`resumes_${user.email}`);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const list = Array.isArray(parsed) ? parsed : [];
      setSavedResumes(list);
      if (list[0]?.url) setSelectedResumeUrl(list[0].url);
    } catch (_err) {
      // ignore malformed local data
    }
  }, [isCandidate, user?.email]);

  const handleApplyFromPage = async () => {
    if (!jobId) return;
    try {
      setApplying(true);
      await apiClient.applications.apply({
        jobId,
        aiScore: typeof matchMeta.aiScore === "number" ? matchMeta.aiScore : null,
        skills: Array.isArray(matchMeta.matchedSkills) ? matchMeta.matchedSkills : null,
        resumeFileUrl: selectedResumeUrl || null,
      });
      setToast("Application submitted successfully.");
    } catch (error) {
      setToast(error?.message || "Failed to apply.");
    } finally {
      setApplying(false);
    }
  };

  if (state.loading) return <div className="p-6 text-sm">Loading job post...</div>;
  if (state.error) return <div className="p-6 text-sm text-red-400">{state.error}</div>;
  if (!state.job) return <div className="p-6 text-sm">Job not found.</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <div className="text-xs font-mono text-muted-foreground">
              {isCandidate ? "Candidate · Job View" : "Recruiter · Job Post View"}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{state.job.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isCandidate ? (
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
                title="Copy share link"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate(isCandidate ? "/dashboard/candidate" : "/dashboard/recruiter")}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" /> Close
            </button>
          </div>
        </div>

        {toast && (
          <div className="mb-4 rounded-lg border border-border/40 bg-card/50 px-4 py-3 text-sm text-foreground">
            {toast}
          </div>
        )}

        <div className="rounded-xl border border-border/40 bg-card/50 p-5 sm:p-6">
          {isCandidate ? (
            <div className="mb-5 rounded-lg border border-border/40 bg-background/40 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-medium text-foreground">Ready to apply?</div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <select
                    value={selectedResumeUrl}
                    onChange={(e) => setSelectedResumeUrl(e.target.value)}
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="">Apply without attached resume</option>
                    {savedResumes.map((r) => (
                      <option key={r.id} value={r.url}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleApplyFromPage}
                    disabled={applying}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {applying ? "Applying..." : "Apply for this Job"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {!draft ? (
            <p className="text-sm text-muted-foreground">No structured details found for this job.</p>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {draft.locations?.[0] ? (
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-300 inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {draft.locations[0]}
                    </span>
                  ) : null}
                  {expLabel ? (
                    <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-200">
                      {expLabel}
                    </span>
                  ) : null}
                  {draft.employmentType ? (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-100">
                      {draft.employmentType}
                    </span>
                  ) : null}
                  {lpa ? (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-100">
                      {lpa}
                    </span>
                  ) : null}
                </div>

                {draft.keyCallout ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                    {draft.keyCallout}
                  </div>
                ) : null}
              </div>

              <section>
                <h4 className="mb-2 text-sm font-semibold text-foreground">The Role</h4>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {draft.jobSummary || "—"}
                </p>
              </section>

              <section>
                <h4 className="mb-2 text-sm font-semibold text-foreground">What you&apos;ll do</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground whitespace-pre-wrap">
                  {responsibilityLines.length ? responsibilityLines.map((l, i) => <li key={i}>{l}</li>) : <li>—</li>}
                </ul>
              </section>

              <section className="space-y-6">
                <h4 className="text-base font-bold tracking-tight text-foreground">What we&apos;re looking for</h4>

                <div>
                  <div className="mb-3 flex items-center gap-2.5">
                    <Star className="h-5 w-5 shrink-0 text-amber-500" fill="currentColor" strokeWidth={0} />
                    <h5 className="text-sm font-bold text-foreground">Mandatory Skills</h5>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mandatorySkills.length ? mandatorySkills.map((name) => (
                      <span key={name} className="rounded-full bg-sky-500/10 px-3 py-1.5 text-sm font-medium text-sky-100">
                        {name}
                      </span>
                    )) : <span className="text-sm text-muted-foreground">—</span>}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2.5">
                    <Star className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                    <h5 className="text-sm font-bold text-foreground">Good-to-have Skills</h5>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {preferredSkills.length ? preferredSkills.map((name) => (
                      <span key={name} className="rounded-full bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground">
                        {name}
                      </span>
                    )) : <span className="text-sm text-muted-foreground">—</span>}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2.5">
                    <Briefcase className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                    <h5 className="text-sm font-bold text-foreground">Additional Requirements</h5>
                  </div>
                  {addReqLines.length ? (
                    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                      {addReqLines.map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </section>

              <section>
                <h4 className="mb-2 text-sm font-semibold text-foreground">Perks & benefits</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground whitespace-pre-wrap">
                  {perksLines.length ? perksLines.map((l, i) => <li key={i}>{l}</li>) : <li>—</li>}
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

