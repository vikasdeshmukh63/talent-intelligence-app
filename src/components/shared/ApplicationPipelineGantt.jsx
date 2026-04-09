import React, { useMemo } from "react";
import { SquareChartGantt } from "lucide-react";

const STAGES = [
  { id: "Applied", label: "Applied", short: "1" },
  { id: "Under Review", label: "Review", short: "2" },
  { id: "Shortlisted", label: "Shortlist", short: "3" },
  { id: "HR Interview Scheduled", label: "Interview", short: "4" },
];

const STAGE_ORDER = STAGES.reduce((acc, s, i) => {
  acc[s.id] = i;
  return acc;
}, {});

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysBetween(a, b) {
  const ms = Math.abs(b - a);
  return Math.max(1, Math.ceil(ms / 86400000));
}

/**
 * Pipeline-style Gantt: hiring stages as horizontal segments + elapsed time strip.
 * Uses current status only (no per-stage history in DB).
 */
export default function ApplicationPipelineGantt({
  status,
  appliedAt,
  updatedAt,
  jobTitle,
  compact = false,
  theme = "dark",
}) {
  const isLight = theme === "light";
  const { segments, currentIndex, rejected } = useMemo(() => {
    const rej = status === "Rejected";
    const idx = rej ? -1 : (STAGE_ORDER[status] ?? 0);
    return { segments: STAGES, currentIndex: idx, rejected: rej };
  }, [status]);

  const timeInfo = useMemo(() => {
    const start = appliedAt ? new Date(appliedAt).getTime() : Date.now();
    const end = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    const now = Date.now();
    const spanEnd = Math.max(end, now);
    const days = daysBetween(start, spanEnd);
    return { start, spanEnd, days, startLabel: formatDate(appliedAt), updateLabel: formatDate(updatedAt) };
  }, [appliedAt, updatedAt]);

  const barPct = useMemo(() => {
    const minDays = 14;
    const d = Math.max(timeInfo.days, minDays);
    const elapsed = Math.min(100, (timeInfo.spanEnd - timeInfo.start) / (d * 86400000) * 100);
    return Math.max(8, Math.round(elapsed));
  }, [timeInfo]);

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        isLight ? "border-blue-900/25 bg-blue-50/40" : "border-border/40 bg-background/40"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <SquareChartGantt className={`w-3.5 h-3.5 shrink-0 ${isLight ? "text-[#003d82]" : "text-primary"}`} />
        <span className={`font-mono text-[10px] uppercase tracking-wider ${isLight ? "text-gray-700" : "text-muted-foreground"}`}>
          {compact ? "Pipeline" : "Application pipeline"}
        </span>
        {jobTitle ? (
          <span className={`font-mono text-[10px] truncate ${isLight ? "text-gray-900" : "text-foreground"}`}>
            · {jobTitle}
          </span>
        ) : null}
      </div>

      {/* Stage bars (Gantt-style segments) */}
      <div className="flex gap-0.5 rounded-md overflow-hidden h-7 sm:h-8">
        {segments.map((stage, i) => {
          let bg = isLight ? "bg-slate-200/80" : "bg-muted/40";
          let text = isLight ? "text-slate-500" : "text-muted-foreground";
          if (rejected) {
            if (i === 0) {
              bg = isLight ? "bg-amber-200" : "bg-amber-500/30";
              text = isLight ? "text-amber-900" : "text-amber-200";
            } else {
              bg = isLight ? "bg-red-100" : "bg-red-500/20";
              text = isLight ? "text-red-800" : "text-red-300";
            }
          } else if (i < currentIndex) {
            bg = isLight ? "bg-emerald-500/85" : "bg-emerald-500/50";
            text = "text-white";
          } else if (i === currentIndex) {
            bg = isLight ? "bg-[#003d82]" : "bg-primary";
            text = "text-white";
          }
          return (
            <div
              key={stage.id}
              title={stage.label}
              className={`flex-1 min-w-0 flex items-center justify-center font-mono text-[9px] sm:text-[10px] font-semibold transition-colors ${bg} ${text}`}
            >
              <span className="truncate px-0.5">{compact ? stage.short : stage.label}</span>
            </div>
          );
        })}
      </div>

      {rejected ? (
        <p className={`mt-1.5 font-mono text-[10px] ${isLight ? "text-red-700" : "text-red-400"}`}>
          Status: Rejected — candidate is no longer active in this pipeline.
        </p>
      ) : (
        <p className={`mt-1.5 font-mono text-[10px] ${isLight ? "text-gray-600" : "text-muted-foreground"}`}>
          Current stage: <span className="font-semibold text-foreground">{status}</span>
        </p>
      )}

      {/* Time axis strip */}
      <div className={`mt-2 pt-2 border-t ${isLight ? "border-blue-900/15" : "border-border/30"}`}>
        <div className="flex justify-between items-center gap-2 mb-1">
          <span className={`font-mono text-[9px] ${isLight ? "text-gray-600" : "text-muted-foreground"}`}>
            Submitted {timeInfo.startLabel}
          </span>
          <span className={`font-mono text-[9px] ${isLight ? "text-gray-600" : "text-muted-foreground"}`}>
            Last update {timeInfo.updateLabel}
          </span>
        </div>
        <div className={`h-2 rounded-full overflow-hidden ${isLight ? "bg-slate-200" : "bg-muted/50"}`}>
          <div
            className={`h-full rounded-full ${isLight ? "bg-[#003d82]/80" : "bg-primary/80"}`}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <p className={`font-mono text-[9px] mt-1 ${isLight ? "text-gray-500" : "text-muted-foreground/80"}`}>
          ~{timeInfo.days} day{timeInfo.days === 1 ? "" : "s"} in process (from application to latest update)
        </p>
      </div>
    </div>
  );
}
