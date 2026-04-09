import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";
import GlowingOrb from "./GlowingOrb";
import TypewriterText from "./TypewriterText";
import FloatingStats from "./FloatingStats";
import StarField from "./StarField";
import ResumeUploader from "./ResumeUploader";

export default function HeroSection() {
  const { theme } = useTheme();
  const [isShowingResults, setIsShowingResults] = useState(false);

  return (
    <section className={`relative ${isShowingResults ? 'min-h-auto py-12' : 'min-h-screen'} flex flex-col items-center justify-center px-6 ${isShowingResults ? 'pt-4' : 'pt-20'}`}>
      <div className="absolute inset-0 z-0 pointer-events-none"><StarField /></div>
      <div className="absolute inset-0 z-0 pointer-events-none"><GlowingOrb /></div>
      {!isShowingResults && <FloatingStats />}

      <div className="relative z-20 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-mono text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4"
        >
          <TypewriterText />
        </motion.div>

        {!isShowingResults && (
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-display leading-tight"
            layout
          >
            <span className="block text-5xl md:text-7xl lg:text-8xl" style={{ color: "#00B4D8", fontWeight: theme === 'light' ? 900 : 700 }}>
              ESDS
            </span>
            <span className="block mt-1 text-4xl md:text-6xl lg:text-7xl mt-2">
              <span style={{ color: theme === 'light' ? "#003d82" : "#ffffff", fontWeight: theme === 'light' ? 900 : 700 }}>eNlight </span>
              <span style={{ color: "#00B4D8", fontWeight: theme === 'light' ? 900 : 700 }}>Talent</span>
            </span>
            <span className="block text-4xl md:text-6xl lg:text-7xl mt-1" style={{ color: theme === 'light' ? "#003d82" : "#ffffff", fontWeight: theme === 'light' ? 900 : 700 }}>
              Intelligence Platform
            </span>
          </motion.h1>
        )}

        {!isShowingResults && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mt-8 text-sm md:text-base max-w-xl mx-auto leading-relaxed"
            style={{ color: theme === 'light' ? '#888888' : 'hsl(210,12%,45%)', fontWeight: 500 }}
          >
            Enterprise-Grade Sovereign AI for Discovery, Engagement
            <br />
            & Strategic Workforce Intelligence
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="mt-8 w-full flex justify-center"
        >
          <ResumeUploader onResultsChange={setIsShowingResults} />
        </motion.div>

        {!isShowingResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
            className="mt-8 inline-flex items-center gap-3 rounded-full px-6 py-3"
            style={{
              border: theme === 'light' ? "1px solid rgba(0,61,130,0.2)" : "1px solid rgba(0,217,255,0.3)",
              background: "transparent"
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse-glow" style={{ background: theme === 'light' ? "#003d82" : "#00b4d8" }} />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase font-bold" style={{ color: theme === 'light' ? "#003d82" : "#00b4d8" }}>
              Enabling Futurability in Talent
            </span>
          </motion.div>
        )}
      </div>

      {!isShowingResults && (
        <>
          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-0.5 h-6 bg-gradient-to-b from-primary/60 to-transparent rounded-full"
            />
          </motion.div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
        </>
      )}
    </section>
  );
}