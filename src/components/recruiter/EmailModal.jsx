import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Sparkles, RefreshCw, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/client";
import { useAppPopup } from "@/components/shared/AppPopupProvider";

const EMAIL_TEMPLATES = {
  "Interview Scheduled": "interview_invite",
  "Shortlisted": "shortlist",
  "Applied": "acknowledgement",
  "Under Review": "under_review",
  "Rejected": "rejection",
};

const TEMPLATE_LABELS = {
  interview_invite: "Interview Invitation",
  shortlist: "Shortlist Notification",
  acknowledgement: "Application Acknowledgement",
  under_review: "Under Review Update",
  rejection: "Rejection Notice",
};

export default function EmailModal({ candidate, jobTitle, senderName = "Recruiter", onClose }) {
  const popup = useAppPopup();
  const defaultTemplate = EMAIL_TEMPLATES[candidate?.status] || "acknowledgement";
  const [template, setTemplate] = useState(defaultTemplate);
  const [emailBody, setEmailBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const generateEmail = async () => {
    setGenerating(true);
    const signOffRule = `Do NOT include "Best regards", "Sincerely", your name, or any closing signature — the platform will add the real sender name automatically after you send.`;
    const voice = `You are ${senderName}, writing on behalf of ESDS.`;
    const prompts = {
      interview_invite: `${voice}

Write a warm, professional email body for ${candidate.name} invited to interview for "${jobTitle}".
Requirements:
- Plain text only, no markdown.
- Do NOT include "Subject:".
- Keep 4-6 short paragraphs with clear line breaks.
- Mention AI match score ${candidate.score}% and key skills: ${candidate.skills.join(", ")}.
- Include placeholder: [Insert date/time].
- ${signOffRule}`,
      shortlist: `${voice}

Write a congratulatory email body to ${candidate.name} for being shortlisted for "${jobTitle}" at ESDS.
Requirements:
- Plain text only, no markdown.
- Do NOT include "Subject:".
- Use 3-5 short paragraphs with line breaks.
- Mention relevant strengths from skills: ${candidate.skills.join(", ")}.
- ${signOffRule}`,
      acknowledgement: `${voice}

Write an application acknowledgement email body to ${candidate.name} for "${jobTitle}".
Requirements:
- Plain text only, no markdown.
- Do NOT include "Subject:".
- Keep concise, 3-4 short paragraphs.
- ${signOffRule}`,
      under_review: `${voice}

Write a status update email body for ${candidate.name} that their "${jobTitle}" application is under review.
Requirements:
- Plain text only, no markdown.
- Do NOT include "Subject:".
- Keep concise, 3-4 short paragraphs.
- ${signOffRule}`,
      rejection: `${voice}

Write a respectful rejection email body for ${candidate.name} for "${jobTitle}".
Requirements:
- Plain text only, no markdown.
- Do NOT include "Subject:".
- Keep empathetic and concise, 3-4 short paragraphs.
- Encourage future applications.
- ${signOffRule}`,
    };
    const res = await apiClient.integrations.Core.InvokeLLM({ prompt: prompts[template] });
    setEmailBody(res);
    setGenerating(false);
  };

  const handleSend = async () => {
    if (!candidate?.email) {
      await popup.alert("Candidate email is missing.");
      return;
    }
    if (!emailBody?.trim()) {
      await popup.alert("Please generate or enter email content first.");
      return;
    }
    try {
      setSending(true);
      await apiClient.integrations.Core.SendEmail({
        to: candidate.email,
        subject: `${TEMPLATE_LABELS[template] || "Application Update"} · ${jobTitle}`,
        body: emailBody,
      });
      setSent(true);
      setTimeout(() => onClose(), 1800);
    } catch (error) {
      console.error("Send email failed:", error);
      await popup.alert(error?.message || "Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
        onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> Send AI Email
              </h3>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">To: {candidate?.name} · {jobTitle}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {sent ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-8 gap-3">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <p className="font-semibold text-foreground">Email Sent!</p>
              <p className="font-mono text-xs text-muted-foreground text-center">Email delivered to {candidate?.name}</p>
            </motion.div>
          ) : (
            <>
              {/* Template selector */}
              <div className="mb-4">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Email Template</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TEMPLATE_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => { setTemplate(key); setEmailBody(""); }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-all ${template === key ? "bg-primary/20 border-primary text-primary" : "border-border/40 text-muted-foreground hover:border-primary/40"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <Button onClick={generateEmail} disabled={generating} size="sm"
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 mb-4 gap-2 text-xs">
                {generating
                  ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw className="w-3.5 h-3.5" /></motion.span> Generating with AI...</>
                  : <><Sparkles className="w-3.5 h-3.5" /> Generate AI Email</>}
              </Button>

              {/* Email body */}
              {emailBody && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                  <textarea
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    className="w-full h-52 bg-background/60 border border-border/50 rounded-xl px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
                  />
                </motion.div>
              )}

              <Button onClick={handleSend} disabled={!emailBody || sending}
                className="w-full bg-primary hover:bg-primary/90 gap-2 text-sm">
                <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send Email"}
              </Button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}