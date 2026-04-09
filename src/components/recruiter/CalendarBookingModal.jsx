import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, CheckCircle2, Mail, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/client";

export const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

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

export default function CalendarBookingModal({ candidate, jobTitle, applicationId, onClose, onBooked }) {
  const [hosts, setHosts] = useState([]);
  const [hostsError, setHostsError] = useState("");
  const [hostQuery, setHostQuery] = useState("");
  const [selectedHosts, setSelectedHosts] = useState([]);
  const [isHostDropdownOpen, setIsHostDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [busySlots, setBusySlots] = useState([]);
  const [loadingBusy, setLoadingBusy] = useState(false);
  const [step, setStep] = useState("pick");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailBody, setEmailBody] = useState("");
  const [bookingError, setBookingError] = useState("");
  const hostPickerRef = useRef(null);

  const weekDays = getWeekDays();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setHostsError("");
      try {
        const { hosts: list } = await apiClient.interviews.listHosts();
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        setHosts(arr);
      } catch (e) {
        if (!cancelled) setHostsError(e?.message || "Could not load interview hosts");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadBusy = useCallback(async () => {
    if (!selectedDate || selectedHosts.length === 0) {
      setBusySlots([]);
      return;
    }
    const dateStr = toYmd(selectedDate);
    setLoadingBusy(true);
    try {
      const results = await Promise.all(
        selectedHosts.map(async (h) => {
          const { busySlots: slots } = await apiClient.interviews.getAvailability(h.id, dateStr);
          return Array.isArray(slots) ? slots : [];
        })
      );
      const merged = new Set();
      for (const arr of results) for (const s of arr) merged.add(s);
      setBusySlots([...merged]);
    } catch {
      setBusySlots([]);
    } finally {
      setLoadingBusy(false);
    }
  }, [selectedDate, selectedHosts]);

  useEffect(() => {
    loadBusy();
  }, [loadBusy]);

  useEffect(() => {
    if (!isHostDropdownOpen) return undefined;
    const onPointerDown = (event) => {
      if (!hostPickerRef.current) return;
      if (!hostPickerRef.current.contains(event.target)) {
        setIsHostDropdownOpen(false);
      }
    };
    const onEsc = (event) => {
      if (event.key === "Escape") setIsHostDropdownOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [isHostDropdownOpen]);

  const handleConfirm = async () => {
    setStep("confirm");
    setSendingEmail(true);
    setBookingError("");
    const dateStr = selectedDate
      ? selectedDate.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })
      : "";
    const hostName =
      selectedHosts.length > 0 ? selectedHosts.map((h) => h.name).join(", ") : "the interviewers";
    try {
      const res = await apiClient.integrations.Core.InvokeLLM({
        prompt: `Write a professional interview confirmation email to ${candidate?.name} for the "${jobTitle || "role"}" role.
Interview details: ${dateStr} at ${selectedTime} IST with ${hostName}.
Include a note that a calendar invite may follow separately.
Sign off as the recruiting team for ESDS eNlight Talent. Keep it concise and warm. Plain text only, no HTML tags.`,
      });
      const text = typeof res === "string" ? res : res != null ? String(res) : "";
      setEmailBody(text);
    } catch {
      setEmailBody(
        `Hello ${candidate?.name || "there"},\n\nYour interview for "${jobTitle || "the position"}" is scheduled on ${dateStr} at ${selectedTime} IST with ${hostName}.\n\nWe look forward to speaking with you.\n\n— eNlight Talent`
      );
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendAndFinish = async () => {
    if (selectedHosts.length === 0 || !selectedDate || !selectedTime || !candidate?.email) {
      setBookingError("Missing host, slot, or candidate email.");
      return;
    }
    setSubmitting(true);
    setBookingError("");
    try {
      await apiClient.interviews.createBooking({
        interviewerHostUserIds: selectedHosts.map((h) => h.id),
        scheduledDate: toYmd(selectedDate),
        timeSlot: selectedTime,
        candidateName: candidate.name || "Candidate",
        candidateEmail: candidate.email,
        jobTitle: jobTitle || "Position",
        applicationId: applicationId != null ? applicationId : undefined,
        emailBody,
      });
      if (typeof onBooked === "function") onBooked();
      setStep("done");
    } catch (e) {
      setBookingError(e?.message || "Could not save booking");
    } finally {
      setSubmitting(false);
    }
  };

  const noEmail = !candidate?.email?.trim();
  const availableHosts = hosts.filter((h) => {
    if (!hostQuery.trim()) return true;
    const q = hostQuery.trim().toLowerCase();
    return (
      String(h?.name || "").toLowerCase().includes(q) ||
      String(h?.email || "").toLowerCase().includes(q) ||
      String(h?.role || "").toLowerCase().includes(q)
    );
  });
  const selectedIds = new Set(selectedHosts.map((h) => h.id));
  const addHost = (h) => {
    if (!h?.id || selectedIds.has(h.id)) return;
    setSelectedHosts((prev) => [...prev, h]);
    setHostQuery("");
    setSelectedTime(null);
    setIsHostDropdownOpen(false);
  };
  const removeHost = (id) => {
    setSelectedHosts((prev) => prev.filter((h) => h.id !== id));
    setSelectedTime(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-card border border-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Schedule Interview
              </h3>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                {candidate?.name} · {jobTitle}
              </p>
            </div>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {hostsError && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {hostsError}
            </div>
          )}

          {noEmail && step === "pick" && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              This candidate has no email on file; booking cannot send a confirmation.
            </div>
          )}

          {step === "done" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-10 gap-3"
            >
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <p className="font-semibold text-foreground">Interview scheduled</p>
              <p className="font-mono text-xs text-muted-foreground text-center">
                Confirmation sent to {candidate?.email}
              </p>
              <Button onClick={onClose} size="sm" className="mt-2 bg-primary hover:bg-primary/90">
                Done
              </Button>
            </motion.div>
          )}

          {step === "confirm" && (
            <div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4">
                <div className="font-mono text-[10px] text-primary uppercase tracking-wider mb-2">Booking summary</div>
                <div className="space-y-1 font-mono text-xs text-muted-foreground">
                  <div>
                    📅{" "}
                    {selectedDate?.toLocaleDateString("en-IN", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div>🕐 {selectedTime} IST</div>
                  <div>
                    👤 Hosts: {selectedHosts.map((h) => h.name).join(", ")}
                  </div>
                </div>
              </div>

              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> Confirmation email
              </div>
              {sendingEmail ? (
                <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground py-4 justify-center">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <RefreshCw className="w-3.5 h-3.5 text-primary" />
                  </motion.span>
                  Drafting email with AI...
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full h-40 bg-background/60 border border-border/50 rounded-xl px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring mb-2 leading-relaxed"
                  />
                  {bookingError && <p className="text-[11px] text-red-400 mb-2">{bookingError}</p>}
                  <Button
                    onClick={handleSendAndFinish}
                    disabled={submitting || noEmail}
                    className="w-full bg-primary hover:bg-primary/90 gap-2 text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    {submitting ? "Saving..." : "Confirm & send email"}
                  </Button>
                </motion.div>
              )}
            </div>
          )}

          {step === "pick" && (
            <>
              <div className="mb-5">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                  Interview host
                </div>
                {hosts.length === 0 && !hostsError ? (
                  <p className="text-[11px] text-muted-foreground font-mono">Loading hosts…</p>
                ) : (
                  <>
                    {selectedHosts.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {selectedHosts.map((h) => (
                          <span
                            key={h.id}
                            className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-[11px] font-mono text-foreground"
                          >
                            {h.name}
                            <button
                              type="button"
                              onClick={() => removeHost(h.id)}
                              className="text-muted-foreground hover:text-foreground"
                              aria-label={`Remove ${h.name}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div ref={hostPickerRef} className="relative">
                      <input
                        value={hostQuery}
                        onFocus={() => setIsHostDropdownOpen(true)}
                        onChange={(e) => {
                          setHostQuery(e.target.value);
                          setIsHostDropdownOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setIsHostDropdownOpen(false);
                          }
                        }}
                        placeholder="Search recruiter / interviewer…"
                        className="w-full rounded-lg border border-input bg-background/40 px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      {isHostDropdownOpen && (hostQuery.trim() || availableHosts.length > 0) && (
                        <div className="absolute mt-1 w-full max-h-44 overflow-y-auto rounded-xl border border-border bg-card/95 backdrop-blur shadow-lg z-20">
                          {availableHosts.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-muted-foreground font-mono">No matches</div>
                          ) : (
                            availableHosts.map((h) => {
                              const isSelected = selectedIds.has(h.id);
                              return (
                                <button
                                  key={h.id}
                                  type="button"
                                  disabled={isSelected}
                                  onClick={() => addHost(h)}
                                  className={`w-full text-left px-3 py-2 border-b border-border/40 last:border-b-0 transition-colors ${
                                    isSelected ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/40"
                                  }`}
                                >
                                  <div className="text-[12px] font-mono text-foreground">{h.name}</div>
                                  <div className="text-[10px] font-mono text-muted-foreground">
                                    {h.role} · {h.email}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="mb-5">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                  Select date
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((d, i) => {
                    const isSelected = selectedDate?.toDateString() === d.toDateString();
                    const isToday = new Date().toDateString() === d.toDateString();
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedDate(d);
                          setSelectedTime(null);
                        }}
                        className={`flex flex-col items-center py-2 px-1 rounded-lg border text-center transition-all ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border/40 hover:border-primary/40 text-muted-foreground"
                        }`}
                      >
                        <span className="font-mono text-[9px] uppercase">{DAYS[d.getDay()]}</span>
                        <span className={`font-bold text-sm mt-0.5 ${isToday && !isSelected ? "text-primary" : ""}`}>
                          {d.getDate()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && selectedHosts.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                      Slots (busy = unavailable)
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[9px]">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary/40 inline-block" /> Free
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400/40 inline-block" /> Busy
                      </span>
                    </div>
                  </div>
                  {loadingBusy ? (
                    <p className="text-[11px] text-muted-foreground font-mono py-4 text-center">Loading availability…</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5">
                      {TIME_SLOTS.map((t) => {
                        const isBusy = busySlots.includes(t);
                        const isSelected = selectedTime === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => !isBusy && setSelectedTime(t)}
                            disabled={isBusy}
                            className={`py-2 rounded-lg border text-[10px] font-mono transition-all flex flex-col items-center gap-0.5
                            ${
                              isBusy
                                ? "border-red-500/20 bg-red-500/5 text-red-400/40 cursor-not-allowed"
                                : isSelected
                                  ? "bg-primary/20 border-primary text-primary"
                                  : "border-border/40 hover:border-primary/40 text-muted-foreground"
                            }`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {t}
                            {isBusy && <span className="text-[8px] text-red-400/50">Busy</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              <Button
                onClick={handleConfirm}
                disabled={!selectedDate || !selectedTime || selectedHosts.length === 0 || noEmail}
                className="w-full bg-primary hover:bg-primary/90 gap-2 text-sm"
              >
                <Sparkles className="w-4 h-4" /> Next: review email
              </Button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
