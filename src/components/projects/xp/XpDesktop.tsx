"use client";

import { useEffect, useRef, useState } from "react";

type XpDesktopProps = {
  onOpen: () => void;
};

function formatClockTime() {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function Windows7Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 520 420" aria-hidden="true">
      <defs>
        <linearGradient id="w7red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff6a5e" />
          <stop offset="0.45" stopColor="#e83b2f" />
          <stop offset="1" stopColor="#b81612" />
        </linearGradient>
        <linearGradient id="w7green" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7ef06b" />
          <stop offset="0.5" stopColor="#3bd13a" />
          <stop offset="1" stopColor="#159a1a" />
        </linearGradient>
        <linearGradient id="w7blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#77b7ff" />
          <stop offset="0.55" stopColor="#2f86ff" />
          <stop offset="1" stopColor="#0f55c8" />
        </linearGradient>
        <linearGradient id="w7yellow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="0.55" stopColor="#ffbf2f" />
          <stop offset="1" stopColor="#d18a00" />
        </linearGradient>

        <filter id="w7shadow" x="-20%" y="-20%" width="140%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="7" floodColor="#000000" floodOpacity="0.35" />
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.22" />
        </filter>

        <linearGradient id="w7sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.10" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g filter="url(#w7shadow)" transform="translate(70 45) skewX(-6) rotate(-6 190 150)">
        {/* panes */}
        <path d="M20 78 L198 40 L214 172 L40 210 Z" fill="url(#w7red)" />
        <path d="M214 40 L392 14 L408 146 L230 172 Z" fill="url(#w7green)" />
        <path d="M40 214 L214 176 L232 338 L64 372 Z" fill="url(#w7blue)" />
        <path d="M230 176 L408 150 L426 308 L252 338 Z" fill="url(#w7yellow)" />

        {/* separators (crisp, not mushy) */}
        <path d="M210 42 L228 174" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="6" />
        <path d="M42 212 L410 148" stroke="#ffffff" strokeOpacity="0.10" strokeWidth="5" />
        <path d="M214 176 L232 338" stroke="#ffffff" strokeOpacity="0.10" strokeWidth="4" />

        {/* sheen overlay */}
        <path
          d="M18 70 C120 10, 250 10, 410 80 L410 118 C252 64, 120 64, 18 132 Z"
          fill="url(#w7sheen)"
        />
      </g>
    </svg>
  );
}

export function XpDesktop({ onOpen }: XpDesktopProps) {
  const [showIcon, setShowIcon] = useState(false);
  const [selected, setSelected] = useState(false);
  const [opening, setOpening] = useState(false);
  const [clock, setClock] = useState("--:--");
  const openTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const iconTimer = window.setTimeout(() => setShowIcon(true), 2000);
    const firstClockTick = window.setTimeout(() => setClock(formatClockTime()), 0);
    const clockTimer = window.setInterval(() => setClock(formatClockTime()), 60000);

    return () => {
      window.clearTimeout(iconTimer);
      window.clearTimeout(firstClockTick);
      window.clearInterval(clockTimer);
      if (openTimerRef.current) {
        window.clearTimeout(openTimerRef.current);
      }
    };
  }, []);

  const handleDoubleClick = () => {
    if (opening) return;
    setOpening(true);
    openTimerRef.current = window.setTimeout(() => onOpen(), 250);
  };

  return (
    <main
      className={`relative h-screen w-full overflow-hidden supports-[height:100svh]:h-[100svh] ${
        opening ? "scale-[1.03] opacity-0 blur-[2px]" : "scale-100 opacity-100"
      } transition-all duration-300 ease-out`}
      onClick={() => setSelected(false)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_46%,#2f8de8_0%,#1467d4_32%,#0a3f9c_62%,#072967_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.2),rgba(255,255,255,0)_34%),radial-gradient(circle_at_80%_22%,rgba(255,255,255,0.16),rgba(255,255,255,0)_38%),radial-gradient(circle_at_72%_72%,rgba(164,217,255,0.14),rgba(255,255,255,0)_30%),radial-gradient(circle_at_35%_72%,rgba(80,175,255,0.2),rgba(255,255,255,0)_32%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0)_40%,rgba(0,0,0,0.34)_100%)]" />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="win7-swoosh-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.6" />
          </filter>
          <linearGradient id="win7-swoosh-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#win7-swoosh-gradient)" strokeLinecap="round" filter="url(#win7-swoosh-glow)">
          <path d="M -30 790 C 220 680, 430 560, 760 520" strokeWidth="2.1" opacity="0.66" />
          <path d="M -40 770 C 200 650, 470 560, 810 535" strokeWidth="1.7" opacity="0.45" />
          <path d="M -28 745 C 240 640, 485 545, 850 520" strokeWidth="2.5" opacity="0.52" />
          <path d="M 10 730 C 245 610, 500 510, 900 495" strokeWidth="1.9" opacity="0.6" />
          <path d="M 24 708 C 260 585, 538 495, 940 474" strokeWidth="1.5" opacity="0.55" />
          <path d="M 48 682 C 300 568, 572 472, 980 455" strokeWidth="2.3" opacity="0.58" />
          <path d="M 72 660 C 320 548, 608 452, 1030 438" strokeWidth="1.8" opacity="0.42" />
          <path d="M 98 638 C 350 524, 640 432, 1075 424" strokeWidth="2.2" opacity="0.5" />
          <path d="M 128 612 C 382 500, 674 415, 1110 410" strokeWidth="1.6" opacity="0.38" />
          <path d="M 160 592 C 410 478, 698 398, 1146 398" strokeWidth="2" opacity="0.44" />
          <path d="M 196 566 C 446 458, 744 380, 1186 386" strokeWidth="1.5" opacity="0.35" />
          <path d="M 232 544 C 476 438, 776 360, 1218 374" strokeWidth="1.9" opacity="0.4" />
          <path d="M 272 520 C 508 416, 808 344, 1258 360" strokeWidth="1.4" opacity="0.33" />
          <path d="M 310 496 C 544 398, 842 326, 1294 348" strokeWidth="1.7" opacity="0.34" />
          <path d="M 346 476 C 578 380, 870 312, 1320 340" strokeWidth="1.5" opacity="0.29" />
          <path d="M 380 458 C 606 364, 896 296, 1350 332" strokeWidth="1.3" opacity="0.25" />
          <path d="M 416 438 C 636 348, 922 284, 1380 320" strokeWidth="1.6" opacity="0.24" />
          <path d="M 444 420 C 658 334, 942 272, 1410 312" strokeWidth="1.4" opacity="0.21" />
          <path d="M 474 404 C 684 320, 968 258, 1436 300" strokeWidth="1.3" opacity="0.2" />
          <path d="M 500 388 C 706 306, 988 248, 1456 292" strokeWidth="1.2" opacity="0.2" />
          <path d="M 526 372 C 730 292, 1010 236, 1474 284" strokeWidth="1.2" opacity="0.18" />
          <path d="M 548 360 C 748 284, 1024 228, 1488 278" strokeWidth="1.1" opacity="0.17" />
          <path d="M 572 348 C 768 272, 1046 216, 1506 268" strokeWidth="1.1" opacity="0.16" />
          <path d="M 594 334 C 788 260, 1068 206, 1520 258" strokeWidth="1" opacity="0.15" />
        </g>
      </svg>

      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="pointer-events-none translate-x-[28px] translate-y-[10px]">
          <Windows7Logo className="w-[420px] max-w-[78vw]" />
        </div>

        {showIcon ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 translate-x-[-140px] translate-y-[-110px] animate-[fade-in_280ms_ease-out]">
            <div className="relative">
              <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 text-center">
                <div
                  className="inline-flex items-center rounded-none border-2 border-[#1a1a1a] bg-[#fff1a8] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#1c1c1c] shadow-[4px_4px_0_#0b0b0b66]"
                  style={{ fontFamily: "\"Courier New\", ui-monospace, monospace" }}
                >
                  double click
                </div>
                <svg
                  className="mx-auto mt-2 h-12 w-12 rotate-[20deg]"
                  viewBox="0 0 16 16"
                  shapeRendering="crispEdges"
                >
                  <rect x="0" y="0" width="2" height="2" fill="#111" />
                  <rect x="2" y="2" width="2" height="2" fill="#111" />
                  <rect x="4" y="4" width="2" height="2" fill="#111" />
                  <rect x="6" y="6" width="2" height="2" fill="#111" />
                  <rect x="8" y="8" width="2" height="2" fill="#111" />
                  <rect x="10" y="10" width="2" height="2" fill="#111" />
                  <rect x="12" y="12" width="2" height="2" fill="#111" />
                  <rect x="10" y="12" width="2" height="2" fill="#111" />
                  <rect x="12" y="10" width="2" height="2" fill="#111" />
                  <rect x="8" y="12" width="2" height="2" fill="#111" />
                  <rect x="12" y="8" width="2" height="2" fill="#111" />
                </svg>
              </div>

              <button
                type="button"
                aria-label="Instagram desktop app icon"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelected(true);
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  handleDoubleClick();
                }}
                className={`relative flex flex-col items-center gap-2 rounded-xl px-4 py-3 text-white transition ${
                  selected ? "bg-[#2f6ac844] ring-2 ring-white/75" : "hover:bg-white/10"
                }`}
              >
                <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-[linear-gradient(135deg,#f9d86a_0%,#f77737_32%,#d62976_60%,#962fbf_85%,#4f5bd5_100%)] shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="white" strokeWidth="1.8">
                    <rect x="4.6" y="4.6" width="14.8" height="14.8" rx="4.2" />
                    <circle cx="12" cy="12" r="3.9" />
                    <circle cx="16.9" cy="7.3" r="1.15" fill="white" stroke="none" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.65)]">Instagram</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-30 h-12 border-t border-white/35 bg-black/30 backdrop-blur-[12px] shadow-[0_-1px_0_rgba(255,255,255,0.35),0_-14px_50px_rgba(0,0,0,0.35)]">
        <div className="flex h-full items-center justify-between px-2 sm:px-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full border border-[#5cb4ff] bg-[radial-gradient(circle_at_30%_30%,#8fe0ff_0%,#4aa7ff_38%,#1b66cf_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.65),0_0_14px_rgba(77,174,255,0.55)]">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M4.5 4.5h6.2v6.2H4.5z" fill="#f45f56" />
                <path d="M12 3.8l7.5-1.3v8.2H12z" fill="#7ad04a" />
                <path d="M4.5 11.3h6.2v8.2L4.5 20.6z" fill="#5cb0ff" />
                <path d="M12 11.3h7.5v10.2L12 20.3z" fill="#ffd95b" />
              </svg>
            </div>
            <div className="h-8 w-14 rounded-lg border border-white/20 bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]" />
            <div className="h-8 w-10 rounded-lg border border-white/16 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]" />
          </div>

          <div className="flex h-9 items-center gap-2 rounded-md border border-white/20 bg-white/14 px-3 text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#9ce8ff]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#d7efff]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#8dd2ff]" />
            <span className="min-w-[64px] text-right text-sm font-medium">{clock}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
