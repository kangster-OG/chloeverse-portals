"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export type RitualStage = "idle" | "settling" | "revealed";

export function useRitualReveal(initialRevealed = false, settleMs = 560) {
  const [stage, setStage] = useState<RitualStage>(initialRevealed ? "revealed" : "idle");

  useEffect(() => {
    if (stage !== "settling") return;
    const timer = window.setTimeout(() => {
      setStage("revealed");
    }, settleMs);
    return () => window.clearTimeout(timer);
  }, [settleMs, stage]);

  return {
    stage,
    trigger() {
      setStage((current) => (current === "idle" ? "settling" : current));
    },
    isRevealed: stage === "revealed",
    isSettling: stage === "settling",
  };
}

export function MobileRitualSettle({
  accent,
  label,
  detail,
}: {
  accent: string;
  label: string;
  detail: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.99 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-black/36 p-5 backdrop-blur-xl"
    >
      <div className="relative overflow-hidden rounded-[1.55rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] px-5 py-7">
        <div
          className="absolute left-1/2 top-4 bottom-4 w-px -translate-x-1/2"
          style={{ background: `linear-gradient(180deg, transparent, ${accent}, transparent)` }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
          style={{ background: `radial-gradient(circle, ${accent}cc 0%, transparent 72%)` }}
          animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.88, 1.08, 0.88] }}
          transition={{ duration: 1.15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <div className="relative text-center">
          <p className="chv-mobile-mono text-[0.56rem] uppercase tracking-[0.32em] text-white/44">
            signal aligning
          </p>
          <h2 className="chv-mobile-display mt-4 text-[1.95rem] leading-[0.9] tracking-[-0.05em] text-[#f4eee6]">
            {label}
          </h2>
          <p className="mx-auto mt-4 max-w-[15rem] text-sm leading-6 text-white/56">
            {detail}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
