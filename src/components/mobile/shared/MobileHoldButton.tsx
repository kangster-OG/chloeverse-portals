"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type MobileHoldButtonProps = {
  label: string;
  hint: string;
  accent: string;
  onComplete: () => void;
  durationMs?: number;
};

export function MobileHoldButton({
  label,
  hint,
  accent,
  onComplete,
  durationMs = 850,
}: MobileHoldButtonProps) {
  const reducedMotion = useReducedMotion();
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    startRef.current = null;
    if (!completedRef.current) {
      setProgress(0);
    }
  };

  const step = (time: number) => {
    if (startRef.current === null) {
      startRef.current = time;
    }

    const next = Math.min(1, (time - startRef.current) / durationMs);
    setProgress(next);

    if (next >= 1) {
      completedRef.current = true;
      onComplete();
      return;
    }

    frameRef.current = window.requestAnimationFrame(step);
  };

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  const start = () => {
    if (completedRef.current) return;
    if (reducedMotion) {
      completedRef.current = true;
      setProgress(1);
      onComplete();
      return;
    }
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = window.requestAnimationFrame(step);
  };

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={reset}
      onPointerLeave={reset}
      onPointerCancel={reset}
      onClick={(event) => {
        if (reducedMotion || event.detail === 0) {
          if (!completedRef.current) {
            completedRef.current = true;
            setProgress(1);
            onComplete();
          }
          return;
        }
        if (!completedRef.current) {
          event.preventDefault();
        }
      }}
      className="relative w-full overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/36 px-5 py-5 text-left backdrop-blur-xl"
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-y-0 left-0"
        animate={{ width: `${progress * 100}%` }}
        transition={{ ease: "linear", duration: reducedMotion ? 0 : 0.08 }}
        style={{
          background: `linear-gradient(90deg, ${accent} 0%, rgba(255,255,255,0.9) 100%)`,
          opacity: 0.26,
        }}
      />
      <span className="chv-mobile-mono relative block text-[0.6rem] uppercase tracking-[0.3em] text-white/54">
        {hint}
      </span>
      <span className="chv-mobile-display relative mt-3 block text-[1.55rem] leading-[0.92] tracking-[-0.05em] text-[#f5efe7]">
        {label}
      </span>
    </button>
  );
}
