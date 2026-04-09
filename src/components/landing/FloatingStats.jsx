import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";

const stats = [
  { value: "97%", label: "Match Accuracy", delay: 0.2, x: "-36vw", y: "-12vh" },
  { value: "10x", label: "Faster Screening", delay: 0.4, x: "36vw", y: "-12vh" },
  { value: "100%", label: "Bias-Free AI", delay: 0.6, x: "36vw", y: "16vh" },
  { value: "2M+", label: "Profiles Ranked", delay: 0.8, x: "-36vw", y: "16vh", isCounter: true },
];

function AnimatedCounter({ isLight }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isLight) return;
    
    let animationFrame;
    const startTime = Date.now();
    const duration = 2000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * 2000000));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isLight]);

  if (!isLight) return "2M+";
  
  return `${(count / 1000000).toFixed(1)}M+`;
}

export default function FloatingStats() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <>
      {stats.map((s, i) => (
        <motion.div
          key={i}
          className="absolute z-[1] pointer-events-none"
          style={{ left: "50%", top: "50%" }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1, x: s.x, y: s.y }}
          transition={{ duration: 0.8, delay: s.delay, ease: "easeOut" }}
        >
          <motion.div
            animate={isLight ? { y: [0, -16, 0], scale: [1, 1.02, 1] } : { y: [0, -12, 0] }}
            transition={{ duration: isLight ? 3.2 : 3.5, delay: i * 0.4, repeat: Infinity, ease: "easeInOut" }}
            className="bg-background/70 backdrop-blur-md border rounded-xl px-4 py-2.5 text-center shadow-lg transition-all"
            style={{ 
              borderColor: isLight ? "rgba(0,61,130,0.25)" : "hsl(190,90%,50%,0.2)",
              boxShadow: isLight ? "0 0 24px rgba(46,168,216,0.12)" : "0 0 20px hsl(190,90%,50%,0.08)",
            }}
          >
            <div className="font-display font-bold text-xl leading-none" style={{ color: isLight ? "#003d82" : "hsl(190,90%,50%)", fontWeight: isLight ? 900 : 700 }}>
              {s.isCounter ? <AnimatedCounter isLight={isLight} /> : s.value}
            </div>
            <div className="font-mono text-[9px] tracking-widest uppercase mt-0.5" style={{ color: isLight ? "#000000" : "hsl(210,40%,98%)", fontWeight: isLight ? 700 : 400 }}>{s.label}</div>
          </motion.div>
        </motion.div>
      ))}
    </>
  );
}