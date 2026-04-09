import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/client";
import { TIME_SLOTS } from "@/components/recruiter/CalendarBookingModal.jsx";
import { useAppPopup } from "@/components/shared/AppPopupProvider";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekDays() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

export default function InterviewerAvailabilityModal({ onClose }) {
  const popup = useAppPopup();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const weekDays = getWeekDays();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.interviews.getMySchedule();
      setSchedule(data);
    } catch (e) {
      setError(e?.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dateStr = toYmd(selectedDate);
  const manualForDay = (schedule?.manualBusy || []).filter((s) => s.date === dateStr);
  const manualSet = new Set(manualForDay.map((s) => s.timeSlot));
  const hostingForDay = (schedule?.hostingInterviews || []).filter((b) => b.scheduledDate === dateStr);
  const hostingSlots = new Set(hostingForDay.map((b) => b.timeSlot));

  const toggleBusy = async (timeSlot) => {
    if (hostingSlots.has(timeSlot)) return;
    try {
      if (manualSet.has(timeSlot)) {
        await apiClient.interviews.removeMyBusy(dateStr, timeSlot);
      } else {
        await apiClient.interviews.addMyBusy({ date: dateStr, timeSlot });
      }
      await refresh();
    } catch (e) {
      await popup.alert(e?.message || "Could not update availability");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1250] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> My availability
            </h3>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground font-mono mb-4">
            Mark times you are <strong className="text-foreground">busy</strong>. Recruiters will see those slots as unavailable when booking interviews with you.
          </p>

          {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

          <div className="mb-4">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Week</div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((d, i) => {
                const isSelected = selectedDate.toDateString() === d.toDateString();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center py-2 px-1 rounded-lg border text-center transition-all text-[10px] font-mono ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border/40 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <span className="text-[9px] uppercase">{DAYS[d.getDay()]}</span>
                    <span className="font-bold">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5 mb-6">
              {TIME_SLOTS.map((t) => {
                const booked = hostingSlots.has(t);
                const busyManual = manualSet.has(t);
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={booked}
                    onClick={() => toggleBusy(t)}
                    className={`py-2 rounded-lg border text-[10px] font-mono transition-all ${
                      booked
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-200 cursor-not-allowed"
                        : busyManual
                          ? "border-red-500/40 bg-red-500/10 text-red-300"
                          : "border-border/40 text-muted-foreground hover:border-primary/40"
                    }`}
                    title={booked ? "Interview already booked" : busyManual ? "Click to mark free" : "Click to mark busy"}
                  >
                    {t}
                    {booked && <span className="block text-[8px] opacity-80">Interview</span>}
                    {!booked && busyManual && <span className="block text-[8px] opacity-80">Busy</span>}
                  </button>
                );
              })}
            </div>
          )}

          <div className="border-t border-border/40 pt-4 space-y-3">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Upcoming as host</div>
            {(schedule?.hostingInterviews || []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No interviews on your calendar yet.</p>
            ) : (
              <ul className="space-y-2 max-h-36 overflow-y-auto text-xs font-mono">
                {schedule.hostingInterviews.map((b) => (
                  <li key={b.id} className="border border-border/30 rounded-lg px-3 py-2">
                    <div className="text-foreground">
                      {b.scheduledDate} {b.timeSlot}
                    </div>
                    <div className="text-muted-foreground">
                      {b.candidateName} · {b.jobTitle}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button variant="outline" className="w-full mt-4" onClick={onClose}>
            Close
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
