import React from "react";
import { motion } from "framer-motion";

const rings = [];

const SIZE = 900;
const CX = SIZE / 2;
const CY = SIZE / 2;

export default function GlowingOrb() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Radial ambient glow */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, hsl(190,90%,50%,0.05) 0%, transparent 65%)" }}
      />

      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute"
        style={{ overflow: "visible" }}
      >
        <defs>
          <filter id="dotGlow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {rings.map(({ r, opacity, duration, direction }, i) => (
          <motion.g
            key={i}
            style={{ transformOrigin: `${CX}px ${CY}px` }}
            animate={{ rotate: direction * 360 }}
            transition={{ duration, repeat: Infinity, ease: "linear" }}
          >
            {/* Ring */}
            <circle
              cx={CX} cy={CY} r={r}
              fill="none"
              stroke={`hsla(190,60%,70%,${opacity})`}
              strokeWidth="1"
            />

          </motion.g>
        ))}
      </svg>
    </div>
  );
}