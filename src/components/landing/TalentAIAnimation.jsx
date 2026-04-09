import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

const NODES = [
  { id: 1, x: 50, y: 22, label: "AI Sourcing", icon: "⬡", description: "Discovery & Outreach", metrics: ["Candidate Pool Size", "Source Diversity", "Quality Score"] },
  { id: 2, x: 15, y: 42, label: "Resume Parse", icon: "⬡", description: "Resume Analysis", metrics: ["Documents Processed", "Accuracy Rate", "Data Extraction Speed"] },
  { id: 3, x: 85, y: 42, label: "Skill Match", icon: "⬡", description: "Skill Assessment", metrics: ["Match Precision", "Skills Identified", "Relevance Score"] },
  { id: 4, x: 28, y: 72, label: "Engagement", icon: "⬡", description: "Candidate Communication", metrics: ["Response Rate", "Engagement Time", "Message Success"] },
  { id: 5, x: 72, y: 72, label: "Analytics", icon: "⬡", description: "Performance Insights", metrics: ["Pipeline Health", "Time-to-Hire", "Quality Metrics"] },
  { id: 6, x: 50, y: 90, label: "Hire Intelligence", icon: "⬡", description: "Final Recommendations", metrics: ["Prediction Accuracy", "Offer Success Rate", "Cultural Fit Score"] },
];

const EDGES = [
  [1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6], [2, 3], [1, 6],
];

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 4,
}));

const BINARY_LINES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  text: Array.from({ length: 18 }, () => Math.round(Math.random())).join(" "),
  y: 10 + i * 9,
  duration: 1.5 + Math.random() * 2,
  delay: Math.random() * 3,
  minOpacity: Math.random() > 0.5 ? 0.1 : 0.8,
}));

const SCANNING_PROFILES = [
  { name: "Senior Engineer", match: 97, skills: ["Python", "ML", "Cloud"] },
  { name: "Product Manager", match: 94, skills: ["Strategy", "AI", "Agile"] },
  { name: "Data Scientist", match: 91, skills: ["NLP", "Analytics", "R"] },
];

export default function TalentAIAnimation() {
  const { theme } = useTheme();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeNode, setActiveNode] = useState(0);
  const [scanLine, setScanLine] = useState(0);
  const [profileIdx, setProfileIdx] = useState(0);
  const [matchValue, setMatchValue] = useState(0);
  const [dataStream, setDataStream] = useState([]);
  const [metrics, setMetrics] = useState([
    { label: "Culture Fit", val: 88 },
    { label: "Technical Depth", val: 94 },
    { label: "Leadership", val: 76 },
    { label: "Innovation", val: 91 },
  ]);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!isInView) return;
    const nodeInterval = setInterval(() => setActiveNode(n => (n + 1) % NODES.length), 900);
    const scanInterval = setInterval(() => setScanLine(s => (s + 1) % 100), 30);
    const profileInterval = setInterval(() => {
      setProfileIdx(p => (p + 1) % SCANNING_PROFILES.length);
      setMatchValue(0);
    }, 2800);
    return () => { clearInterval(nodeInterval); clearInterval(scanInterval); clearInterval(profileInterval); };
  }, [isInView]);

  useEffect(() => {
    if (!isInView) return;
    const target = SCANNING_PROFILES[profileIdx].match;
    let val = 0;
    const inc = setInterval(() => {
      val += 2;
      if (val >= target) { setMatchValue(target); clearInterval(inc); }
      else setMatchValue(val);
    }, 25);
    return () => clearInterval(inc);
  }, [profileIdx, isInView]);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      const tags = ["Resume Analyzed", "Skill Extracted", "Bias Removed", "Candidate Ranked", "JD Matched", "AI Scored", "Network Mapped", "Talent Found"];
      setDataStream(prev => [{ id: Date.now(), text: tags[Math.floor(Math.random() * tags.length)] }, ...prev].slice(0, 5));
    }, 700);
    return () => clearInterval(interval);
  }, [isInView]);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(m => ({
        ...m,
        val: Math.floor(65 + Math.random() * 33),
      })));
    }, 1800);
    return () => clearInterval(interval);
  }, [isInView]);

  const profile = SCANNING_PROFILES[profileIdx];

  return (
    <section ref={ref} id="talent-ai-section" className="relative min-h-screen bg-background flex flex-col items-center justify-center px-6 py-24 overflow-hidden">
      {/* Background grid */}
      {theme !== 'light' && (
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `linear-gradient(hsl(190,90%,50%) 1px, transparent 1px), linear-gradient(90deg, hsl(190,90%,50%) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      )}

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-5"
        style={{ background: `radial-gradient(circle, ${theme === 'light' ? '#2ea8d8' : 'hsl(190,90%,50%)'}, transparent 70%)` }} />

      {/* Floating particles */}
      {PARTICLES.map(p => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: theme === 'light' ? p.size * 2 : p.size, height: theme === 'light' ? p.size * 2 : p.size, background: theme === 'light' ? '#000000' : 'var(--primary)' }}
          animate={{ y: [-8, 8, -8], opacity: theme === 'light' ? [0.4, 1, 0.4] : [0.2, 0.8, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }} />
      ))}

      <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }} className="text-center mb-16 relative z-10">
        <span className={`font-mono text-sm tracking-[0.3em] uppercase mb-3 block ${theme === 'light' ? 'font-bold' : ''}`} style={{ color: theme === 'light' ? '#003d82' : 'var(--primary)' }}>AI-Powered Intelligence Engine</span>
        <h2 className="font-display text-4xl md:text-5xl font-bold" style={{ color: theme === 'light' ? '#000000' : 'var(--foreground)' }}>
          Talent Acquisition, <span style={{ color: theme === 'light' ? '#2ea8d8' : 'var(--primary)' }}>Reimagined</span>
        </h2>
        <p className="text-muted-foreground mt-3 text-sm max-w-lg mx-auto font-bold">
          Real-time AI orchestration across your entire talent pipeline — from discovery to hire.
        </p>
      </motion.div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">

        {/* LEFT: Binary rain + data stream */}
        <motion.div initial={{ opacity: 0, x: -40 }} animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="backdrop-blur border rounded-2xl p-5 h-[420px] overflow-hidden relative"
          style={{ background: theme === 'light' ? 'rgba(255,255,255,0.7)' : 'var(--card)', borderColor: theme === 'light' ? '#003d82' : 'var(--border)' }}>
          <div className="font-mono text-[11px] leading-relaxed select-none absolute inset-4 font-bold" style={{ color: theme === 'light' ? '#1b5e20' : 'var(--primary)' }}>
            {BINARY_LINES.map(line => (
              <motion.div key={line.id}
                animate={{ opacity: [line.minOpacity, 1, line.minOpacity] }}
                transition={{ duration: line.duration, delay: line.delay, repeat: Infinity, ease: "easeInOut" }}>
                {line.text}
              </motion.div>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="font-mono text-[12px] mb-2 tracking-widest uppercase font-bold" style={{ color: theme === 'light' ? '#003d82' : 'var(--primary)' }}>Live Data Stream</div>
            <div className="space-y-1.5">
              {dataStream.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1 - i * 0.15, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center gap-2 font-mono text-[10px] px-2 py-1.5 rounded-md ${theme === 'light' ? 'font-bold' : ''}`}
                  style={{ background: theme === 'light' ? 'rgba(0,61,130,0.06)' : 'rgba(190,90%,50%,0.08)' }}>
                  {i === 0 ? (
                    <motion.span className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                      style={{ background: theme === 'light' ? '#1b5e20' : '#4caf50' }}
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }} />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: theme === 'light' ? '#003d82' : 'var(--primary)' }} />
                  )}
                  <span style={{ color: theme === 'light' ? '#003d82' : 'var(--primary)' }}>{item.text}</span>
                  <span className="ml-auto font-bold" style={{ color: theme === 'light' ? '#1b5e20' : '#4caf50' }}>✓</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CENTER: Neural network graph */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="backdrop-blur border rounded-2xl p-4 h-[420px] relative overflow-hidden flex flex-col"
          style={{ background: theme === 'light' ? 'rgba(255,255,255,0.6)' : 'var(--card)', borderColor: theme === 'light' ? '#003d82' : 'var(--primary)' }}>

          {/* Top label */}
          <div className="text-center mb-2">
             <span className="font-mono text-[12px] tracking-[0.2em] uppercase font-bold" style={{ color: theme === 'light' ? '#003d82' : 'var(--primary)' }}>Neural Talent Graph</span>
           </div>

          {/* SVG Graph */}
          <div className="flex-1 relative -mt-6">
            <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: `drop-shadow(0 0 8px ${theme === 'light' ? '#1b5e20' : 'hsl(190,90%,50%)'}66)` }}>
              {/* Edges */}
              {EDGES.map(([a, b], i) => {
                const from = NODES[a - 1]; const to = NODES[b - 1];
                const isActive = activeNode === a - 1 || activeNode === b - 1;
                return (
                  <motion.line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={isActive ? (theme === 'light' ? '#1b5e20' : "hsl(190,90%,50%)") : (theme === 'light' ? '#1b5e2026' : "hsl(190,90%,50%,0.15)")}
                    strokeWidth={isActive ? "0.6" : "0.3"}
                    animate={{ opacity: isActive ? [0.5, 1, 0.5] : 0.2 }}
                    transition={{ duration: 1, repeat: Infinity }} />
                );
              })}

              {/* Animated pulse along active edges */}
              {EDGES.filter(([a, b]) => activeNode === a - 1 || activeNode === b - 1).map(([a, b], i) => {
                const from = NODES[a - 1]; const to = NODES[b - 1];
                return (
                  <motion.circle key={`pulse-${i}`} r="1" fill={theme === 'light' ? '#1b5e20' : "hsl(190,90%,70%)"}
                    animate={{ cx: [from.x, to.x], cy: [from.y, to.y], opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }} />
                );
              })}

              {/* Nodes (circles only, rendered above edges) */}
              {NODES.map((node, i) => {
                const isActive = activeNode === i;
                return (
                  <g key={node.id} onClick={() => setSelectedNode(node)} style={{ cursor: "pointer" }}>
                    <motion.circle cx={node.x} cy={node.y} r={isActive ? 5 : 3.5}
                      fill={isActive ? (theme === 'light' ? '#1b5e20' : "hsl(190,90%,50%)") : (theme === 'light' ? '#003d82' : "hsl(190,90%,20%)")}
                      stroke={theme === 'light' ? '#1b5e20' : "hsl(190,90%,50%)"} strokeWidth={isActive ? "0.8" : "0.4"}
                      animate={{ r: isActive ? [4, 5.5, 4] : 3.5 }}
                      transition={{ duration: 0.8, repeat: Infinity }} />
                    {isActive && (
                      <motion.circle cx={node.x} cy={node.y} r="8" fill="none"
                        stroke={theme === 'light' ? '#1b5e20' : "hsl(190,90%,50%)"} strokeWidth="0.3"
                        animate={{ r: [5, 10], opacity: [0.8, 0] }}
                        transition={{ duration: 1, repeat: Infinity }} />
                    )}
                  </g>
                );
              })}

              {/* Labels rendered last so they always appear on top */}
              {NODES.map((node, i) => {
                const isActive = activeNode === i;
                return (
                  <g key={`label-${node.id}`}>
                    <text x={i === 1 ? node.x - 2 : node.x} y={[1, 2].includes(i) ? node.y - 10 : [0].includes(i) ? node.y - 6 : node.y + 10} textAnchor="middle"
                      fill={isActive ? (theme === 'light' ? '#003d82' : "hsl(190,90%,80%)") : (theme === 'light' ? '#003d82' : "hsl(190,30%,60%)")}
                      fontSize="4" fontFamily="monospace" fontWeight={theme === 'light' ? 'bold' : 'normal'}>
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom: scanning bar */}
          <div className="mt-2 px-2">
            <div className="flex justify-between font-mono text-[11px] text-muted-foreground mb-1">
              <span>PROCESSING</span><span style={{ color: theme === 'light' ? '#001a4d' : 'var(--primary)', fontWeight: 'bold' }}>{scanLine}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: theme === 'light' ? 'rgba(27,94,32,0.2)' : 'var(--muted)' }}>
              <motion.div className="h-full rounded-full"
                style={{ width: `${scanLine}%`, background: theme === 'light' ? '#1b5e20' : 'var(--primary)', boxShadow: theme === 'light' ? "0 0 8px #1b5e20" : "0 0 8px hsl(190,90%,50%)" }} />
            </div>
          </div>
        </motion.div>

        {/* RIGHT: AI candidate scanner */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="backdrop-blur border rounded-2xl p-5 h-[420px] flex flex-col gap-4 overflow-hidden"
          style={{ background: theme === 'light' ? 'rgba(255,255,255,0.7)' : 'var(--card)', borderColor: theme === 'light' ? '#003d82' : 'var(--border)' }}>

          <div className="font-mono text-[12px] tracking-[0.2em] uppercase font-bold" style={{ color: theme === 'light' ? '#003d82' : 'var(--primary)' }}>AI Candidate Scoring</div>

          {/* Profile card */}
          <motion.div key={profileIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="border rounded-xl p-3"
          style={{ background: theme === 'light' ? 'linear-gradient(135deg, rgba(0,61,130,0.12) 0%, rgba(46,168,216,0.06) 100%)' : 'var(--background)', borderColor: theme === 'light' ? '#003d8240' : 'var(--primary)', boxShadow: theme === 'light' ? '0 4px 12px rgba(0,61,130,0.1)' : '0 4px 12px rgba(190,90%,50%,0.15)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ background: theme === 'light' ? 'linear-gradient(135deg, #003d82, #2ea8d8)' : 'var(--primary)', borderColor: theme === 'light' ? '#003d82' : 'var(--primary)', boxShadow: theme === 'light' ? '0 0 8px rgba(0,61,130,0.3)' : '0 0 8px rgba(190,90%,50%,0.3)' }}>
                <span className="text-[10px] font-bold" style={{ color: '#ffffff' }}>{profile.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold leading-tight" style={{ color: theme === 'light' ? '#003d82' : 'var(--foreground)' }}>{profile.name}</div>
                <div className="text-[8px] font-mono" style={{ color: theme === 'light' ? '#1b5e20' : 'var(--muted-foreground)' }}>AI-evaluated candidate</div>
              </div>
            </div>
            <div className="w-full h-px" style={{ background: theme === 'light' ? 'rgba(0,61,130,0.1)' : 'var(--border)' }} />
            <div className="mt-3"></div>
            {/* Match score ring */}
            <div className="flex items-center gap-3">
              <div className={`relative w-14 h-14 flex-shrink-0 flex items-center justify-center ${theme === 'light' ? 'rounded-lg border-2 p-1.5' : ''}`} style={{ borderColor: theme === 'light' ? '#1b5e20' : 'var(--primary)', background: 'transparent' }}>
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke={theme === 'light' ? '#1b5e2026' : "hsl(190,90%,50%,0.1)"} strokeWidth="3" />
                  <motion.circle cx="18" cy="18" r="14" fill="none" stroke={theme === 'light' ? '#1b5e20' : "hsl(190,90%,50%)"} strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${matchValue * 0.88} 88`}
                    style={{ filter: `drop-shadow(0 0 6px ${theme === 'light' ? '#1b5e20cc' : 'hsl(190,90%,50%)'})` }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                   <span className="font-mono text-xs font-bold" style={{ color: theme === 'light' ? '#001a4d' : 'var(--primary)' }}>{matchValue}%</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map(skill => (
                   <span key={skill} className="font-mono text-[11px] px-2 py-1 rounded-full border-2 font-bold transition-all hover:scale-105"
                      style={{ borderColor: theme === 'light' ? '#003d82' : 'var(--primary)', color: theme === 'light' ? '#003d82' : 'var(--primary)', background: theme === 'light' ? 'linear-gradient(135deg, rgba(0,61,130,0.15), rgba(46,168,216,0.1))' : 'var(--primary)' }}>
                      {skill}
                    </span>
                 ))}
              </div>
            </div>
          </motion.div>

          {/* Metric bars */}
          <div className="space-y-2 mt-3">
          {metrics.map(({ label, val }) => (
            <div key={label} className="group">
              <div className="flex justify-between font-mono text-xs mb-1 font-bold">
                 <span style={{ color: theme === 'light' ? '#003d82' : 'var(--muted-foreground)' }}>{label}</span><span style={{ color: theme === 'light' ? '#001a4d' : 'var(--primary)', fontWeight: 'bold' }}>{val}%</span>
               </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme === 'light' ? 'rgba(0,61,130,0.08)' : 'var(--muted)' }}>
                <motion.div className="h-full rounded-full transition-all duration-300"
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  style={{ background: theme === 'light' ? "linear-gradient(90deg, #1b5e20 0%, #4caf50 100%)" : "linear-gradient(90deg, hsl(190,90%,40%), hsl(190,90%,60%))", boxShadow: theme === 'light' ? "0 0 8px #1b5e2088" : "0 0 8px hsl(190,90%,50%,0.6)" }} />
              </div>
            </div>
          ))}
          </div>

          {/* Status */}
          <div className="mt-auto flex items-center gap-2 font-mono text-[11px] rounded-full px-3 py-1.5 border-2 font-bold transition-all"
            style={{ color: theme === 'light' ? '#003d82' : 'var(--primary)', borderColor: theme === 'light' ? '#003d82' : 'var(--primary)', background: theme === 'light' ? 'linear-gradient(135deg, rgba(0,61,130,0.15), rgba(46,168,216,0.1))' : 'var(--primary)' }}>
            <motion.span animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-1 rounded-full" style={{ background: theme === 'light' ? '#1b5e20' : '#4caf50' }} />
            AI Engine Active
          </div>
        </motion.div>
      </div>

      {/* Bottom label */}
      <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 1 }}
        className="mt-14 text-center relative z-10">
        <span className={`font-mono text-xs tracking-[0.3em] uppercase text-muted-foreground ${theme === 'light' ? 'font-bold' : ''}`}>
          Powered by eNlight AI · Real-time · Unbiased · Enterprise-Grade Sovereign AI
        </span>
      </motion.div>

      {/* Node Details Modal */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedNode(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          >
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:w-96 bg-card/90 backdrop-blur border border-border/50 rounded-t-2xl sm:rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedNode.label}</h3>
                  <p className="text-sm text-muted-foreground">{selectedNode.description}</p>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 pt-2">
                <p className="font-mono text-[10px] tracking-widest uppercase text-primary/60">Metrics</p>
                {selectedNode.metrics.map((metric, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between bg-background/40 rounded-lg p-3 border border-primary/10"
                  >
                    <span className="text-sm text-muted-foreground">{metric}</span>
                    <span className="font-mono text-sm font-bold text-primary">
                      {Math.floor(70 + Math.random() * 30)}%
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}