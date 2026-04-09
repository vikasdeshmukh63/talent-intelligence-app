import React, { useState, useEffect } from "react";
import { useTheme } from "@/lib/ThemeContext";

const phrases = [
  "Discover top talent",
  "Eliminate hiring bias",
  "Predict cultural fit",
  "Accelerate time-to-hire",
  "Unlock workforce intelligence",
];

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export default function TypewriterText() {
  const { theme } = useTheme();
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    let timeout;
    if (!deleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 60);
    } else if (!deleting && displayed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % phrases.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, phraseIdx]);

  return (
    <span style={{ 
      color: theme === 'light' ? "#003d82" : "#00b4d8", 
      fontWeight: theme === 'light' ? 900 : 600,
      fontFamily: theme === 'light' ? 'var(--font-display)' : 'var(--font-sans)',
      letterSpacing: theme === 'light' ? '0.05em' : '0'
    }}>
      {capitalize(displayed)}
      <span className="animate-pulse">|</span>
    </span>
  );
}