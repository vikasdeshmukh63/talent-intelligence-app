import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDays() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

export default function InterviewBookingModal({ candidate, jobTitle, onClose, onBooked }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [booked, setBooked] = useState(false);

  const weekDays = getWeekDays();

  const handleBook = () => {
    setBooked(true);
    setTimeout(() => {
      onBooked?.({ candidate: candidate.name, date: selectedDate, time: selectedTime });
      onClose();
    }, 1500);
  };

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
                <Calendar className="w-4 h-4 text-primary" /> Book Interview
              </h3>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{candidate?.name} · {jobTitle}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {booked ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-8 gap-3">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <p className="font-semibold text-foreground">Interview Booked!</p>
              <p className="font-mono text-xs text-muted-foreground text-center">
                {candidate?.name} on {selectedDate?.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })} at {selectedTime}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Date picker */}
              <div className="mb-5">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Select Date</div>
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((d, i) => {
                    const isSelected = selectedDate?.toDateString() === d.toDateString();
                    const isToday = new Date().toDateString() === d.toDateString();
                    return (
                      <button key={i} onClick={() => setSelectedDate(d)}
                        className={`flex flex-col items-center py-2 px-1 rounded-lg border text-center transition-all ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border/40 hover:border-primary/40 text-muted-foreground hover:text-foreground"}`}>
                        <span className="font-mono text-[9px] uppercase">{DAYS[d.getDay()]}</span>
                        <span className={`font-bold text-sm mt-0.5 ${isToday && !isSelected ? "text-primary" : ""}`}>{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Select Time Slot</div>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map(t => (
                      <button key={t} onClick={() => setSelectedTime(t)}
                        className={`py-2 rounded-lg border text-[11px] font-mono transition-all flex items-center justify-center gap-1 ${selectedTime === t ? "bg-primary/20 border-primary text-primary" : "border-border/40 hover:border-primary/40 text-muted-foreground hover:text-foreground"}`}>
                        <Clock className="w-2.5 h-2.5" />{t}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <Button onClick={handleBook} disabled={!selectedDate || !selectedTime}
                className="w-full bg-primary hover:bg-primary/90 gap-2 text-sm">
                <Calendar className="w-4 h-4" /> Confirm Booking
              </Button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}