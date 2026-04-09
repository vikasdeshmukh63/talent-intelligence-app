import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

export default function InterviewScheduler({ profiles = [] }) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
  ];

  const handleSchedule = () => {
    if (selectedCandidate && selectedDate && selectedTime) {
      const interview = {
        id: Date.now(),
        candidate: selectedCandidate.title,
        match: selectedCandidate.match,
        date: selectedDate,
        time: selectedTime,
      };
      setScheduledInterviews([...scheduledInterviews, interview]);
      setShowSuccess(true);
      setSelectedCandidate(null);
      setSelectedDate(null);
      setSelectedTime("");
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const removeInterview = (id) => {
    setScheduledInterviews(scheduledInterviews.filter(i => i.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 w-full max-w-2xl mx-auto"
    >
      <div className="border border-border/50 rounded-xl p-6 bg-card/30 backdrop-blur">
        <h3 className="font-semibold text-lg text-foreground mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Schedule Interviews
        </h3>

        {/* Candidate Selection */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-3 block">Select Top Candidate</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {profiles.slice(0, 2).map((profile) => (
              <button
                key={profile.title}
                onClick={() => setSelectedCandidate(profile)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedCandidate?.title === profile.title
                    ? "border-primary bg-primary/10"
                    : "border-border/30 hover:border-primary/50"
                }`}
              >
                <div className="font-semibold text-sm">{profile.title}</div>
                <div className="text-xs text-muted-foreground">{profile.match}% match</div>
              </button>
            ))}
          </div>
        </div>

        {selectedCandidate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Date Selection */}
            <div>
              <label className="text-sm text-muted-foreground mb-3 block">Pick Interview Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label className="text-sm text-muted-foreground mb-3 block">Pick Time Slot</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 px-3 rounded-lg border text-sm transition-all font-mono ${
                        selectedTime === time
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border/50 hover:border-primary/50"
                      }`}
                    >
                      <Clock className="w-3 h-3 inline mr-1" />
                      {time}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Schedule Button */}
            {selectedTime && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  onClick={handleSchedule}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Schedule Interview
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Scheduled Interviews List */}
        {scheduledInterviews.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border/30">
            <h4 className="text-sm font-semibold text-foreground mb-4">Scheduled Interviews</h4>
            <div className="space-y-2">
              <AnimatePresence>
                {scheduledInterviews.map((interview) => (
                  <motion.div
                    key={interview.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div>
                      <div className="text-sm font-semibold text-foreground">{interview.candidate}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(interview.date, "MMM dd, yyyy")} at {interview.time}
                      </div>
                    </div>
                    <button
                      onClick={() => removeInterview(interview.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-500">Interview scheduled successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}