import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Calendar } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { apiClient } from "@/api/client";
import InterviewerAvailabilityModal from "@/components/recruiter/InterviewerAvailabilityModal.jsx";

const ESDS_LOGO = "/vite.svg";

export default function InterviewerDashboardPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadSchedule = useCallback(async () => {
    try {
      const data = await apiClient.interviews.getMySchedule();
      setSchedule(data);
    } catch {
      setSchedule(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const u = await apiClient.auth.me();
      setUser(u);
    })();
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const upcoming = schedule?.hostingInterviews || [];

  return (
    <div className="fixed inset-0 z-[1000] bg-background overflow-y-auto">
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(190,90%,50%) 1px, transparent 1px), linear-gradient(90deg, hsl(190,90%,50%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={ESDS_LOGO} alt="ESDS" className="w-10 h-10 object-contain" />
          <div>
            <div className="font-bold text-sm text-foreground">{user?.name || "Interviewer"}</div>
            <div
              className={`font-mono text-[10px] uppercase tracking-wider font-bold ${
                theme === "light" ? "text-[#003d82]" : "text-white"
              }`}
            >
              Interviewer · eNlight Talent
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            <Calendar className="w-3.5 h-3.5" /> Manage availability
          </button>
          <button
            type="button"
            onClick={() => {
              apiClient.auth.logout();
              navigate("/");
            }}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-mono transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold text-foreground mb-2">Your interview schedule</h2>
        <p className="text-sm text-muted-foreground font-mono mb-6">
          When recruiters book with you, sessions appear here. Use Manage availability to block times.
        </p>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/40 p-8 text-center text-muted-foreground text-sm">
            No upcoming interviews.
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border border-border/40 bg-card/60 p-4 font-mono text-sm"
              >
                <div className="text-foreground font-semibold">
                  {b.scheduledDate} · {b.timeSlot} IST
                </div>
                <div className="text-muted-foreground mt-1">{b.jobTitle}</div>
                <div className="text-muted-foreground text-xs mt-2">
                  Candidate: {b.candidateName} ({b.candidateEmail})
                </div>
                {b.recruiter && (
                  <div className="text-[11px] text-primary/80 mt-2">Recruiter: {b.recruiter.name}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && (
        <InterviewerAvailabilityModal
          onClose={() => {
            setShowModal(false);
            loadSchedule();
          }}
        />
      )}
    </div>
  );
}
