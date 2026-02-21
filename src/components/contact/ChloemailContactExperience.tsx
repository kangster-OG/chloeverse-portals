"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type IntroPhase = "typing" | "cursor_to_search" | "clicking_search" | "loading" | "inbox";
type CursorTarget = "address" | "search";

const TYPED_DOMAIN = "chloemail.com";
const CANDY_CASTLE_URL = "https://imchloekang.com";
const CHLOEVERSE_URL = "https://chloeverse.io";

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

export function ChloemailContactExperience() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<IntroPhase>("typing");
  const [typedText, setTypedText] = useState("");
  const [cursorTarget, setCursorTarget] = useState<CursorTarget>("address");
  const [cursorClicking, setCursorClicking] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const transitionDuration = prefersReducedMotion ? 180 : 700;

  const schedule = (callback: () => void, delay: number) => {
    const timeout = window.setTimeout(callback, delay);
    timeoutsRef.current.push(timeout);
  };

  const playBlip = (frequency: number, duration = 0.045, gainValue = 0.02) => {
    if (typeof window === "undefined") return;

    try {
      const AudioContextCtor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;

      const context = audioContextRef.current ?? new AudioContextCtor();
      audioContextRef.current = context;
      if (context.state === "suspended") {
        void context.resume().catch(() => undefined);
      }

      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.01);
    } catch {
      // Autoplay can fail in some browsers; intentionally silent fallback.
    }
  };

  useEffect(() => {
    const typeDelay = prefersReducedMotion ? 26 : 92;
    const initialDelay = prefersReducedMotion ? 40 : 220;

    const typeNextCharacter = (index: number) => {
      if (index >= TYPED_DOMAIN.length) {
        if (prefersReducedMotion) {
          setPhase("clicking_search");
          setCursorClicking(true);
          playBlip(320, 0.06, 0.03);

          schedule(() => setCursorClicking(false), 100);
          schedule(() => setPhase("loading"), 190);
          schedule(() => setPhase("inbox"), 620);
          return;
        }

        setPhase("cursor_to_search");
        setCursorTarget("search");

        schedule(() => {
          setPhase("clicking_search");
          setCursorClicking(true);
          playBlip(300, 0.06, 0.03);

          schedule(() => setCursorClicking(false), 130);
          schedule(() => setPhase("loading"), 240);
          schedule(() => setPhase("inbox"), 1040);
        }, 420);

        return;
      }

      setTypedText(TYPED_DOMAIN.slice(0, index + 1));
      playBlip(620 + index * 14, 0.03, 0.012);
      schedule(() => typeNextCharacter(index + 1), typeDelay);
    };

    schedule(() => typeNextCharacter(0), initialDelay);

    return () => {
      timeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
      timeoutsRef.current = [];
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, [prefersReducedMotion]);

  const cursorPosition = useMemo(
    () =>
      cursorTarget === "address"
        ? { left: "36%", top: "16%" }
        : { left: "85%", top: "16%" },
    [cursorTarget],
  );

  const openCandyCastle = () => {
    window.location.href = CANDY_CASTLE_URL;
  };

  const openChloeverse = () => {
    window.location.href = CHLOEVERSE_URL;
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0f1012] text-[#e8eaed]">
      <section
        className="absolute inset-0"
        style={{
          opacity: phase === "inbox" ? 0 : 1,
          transform: phase === "inbox" ? "scale(0.99)" : "scale(1)",
          pointerEvents: phase === "inbox" ? "none" : "auto",
          transition: `opacity ${transitionDuration}ms ease, transform ${transitionDuration}ms ease`,
        }}
      >
        <div className="h-full w-full bg-[#0f1012] p-3 md:p-5">
          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-[#17181b] shadow-[0_30px_120px_-40px_rgba(0,0,0,0.7)]">
            <div className="border-b border-white/10 bg-[#202124] px-4 py-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
                <div className="ml-4 h-6 w-44 rounded-md bg-white/10" />
                <div className="h-6 w-28 rounded-md bg-white/5" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 flex-1 items-center rounded-full border border-white/15 bg-[#282a2d] px-5 text-sm text-[#e8eaed]">
                  <span>{typedText}</span>
                  {phase !== "inbox" && (
                    <span
                      className="ml-0.5 inline-block h-4 w-[1.5px] bg-[#bdc1c6]"
                      style={{
                        opacity: phase === "typing" ? 1 : 0,
                        transition: `opacity ${prefersReducedMotion ? 80 : 140}ms linear`,
                      }}
                    />
                  )}
                </div>
                <button
                  type="button"
                  className="h-11 rounded-full border border-white/15 bg-[#2f3135] px-6 text-sm font-medium text-[#e8eaed]"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="flex h-[calc(100%-96px)] items-center justify-center px-6">
              <div className="rounded-xl border border-white/10 bg-[#1f2023] px-6 py-3 text-sm text-[#9aa0a6]">
                {phase === "loading" ? "Loading Chloemail inbox..." : "Opening browser..."}
              </div>
            </div>

            <div
              className="pointer-events-none absolute"
              style={{
                ...cursorPosition,
                transform: cursorClicking ? "scale(0.88)" : "scale(1)",
                transition: prefersReducedMotion
                  ? "left 60ms linear, top 60ms linear, transform 80ms ease"
                  : "left 380ms ease, top 380ms ease, transform 90ms ease",
              }}
            >
              <div className="relative">
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-[#f1f3f4] drop-shadow-sm">
                  <path d="M3 2L12.5 21l2.6-7.2L22 11 3 2z" />
                </svg>
                <span
                  className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8ab4f8]/40"
                  style={{
                    opacity: cursorClicking ? 1 : 0,
                    transform: cursorClicking ? "scale(1)" : "scale(0.35)",
                    transition: "opacity 160ms ease, transform 200ms ease",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="absolute inset-0"
        style={{
          opacity: phase === "inbox" ? 1 : 0,
          transform: phase === "inbox" ? "translateY(0)" : "translateY(8px)",
          pointerEvents: phase === "inbox" ? "auto" : "none",
          transition: `opacity ${transitionDuration}ms ease, transform ${transitionDuration}ms ease`,
        }}
      >
        <div className="fixed inset-0 flex flex-col bg-[#0f1012] text-[#e8eaed]">
          <header className="flex h-14 items-center gap-3 border-b border-white/10 bg-[#202124] px-4">
            <div className="flex min-w-[228px] items-center gap-2">
              <button
                type="button"
                onClick={openChloeverse}
                className="grid h-9 w-9 place-items-center rounded-full text-[#e8eaed] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ab4f8]"
                aria-label="Open chloeverse.io"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
              <span className="text-2xl font-semibold tracking-tight text-[#ea4335]">M</span>
              <span className="text-[22px] font-medium leading-none text-[#e8eaed]">Chloemail</span>
            </div>

            <button
              type="button"
              onClick={openCandyCastle}
              className="mx-auto flex h-11 w-full max-w-[820px] items-center rounded-full border border-white/10 bg-[#303134] px-5 text-left text-sm text-[#9aa0a6] hover:bg-[#3a3b3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ab4f8]"
              aria-label="Return to Candy Castle"
            >
              <svg viewBox="0 0 24 24" className="mr-3 h-4 w-4 fill-none stroke-current stroke-[1.8]">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <span>Return to Candy Castle</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Help"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-xs text-[#9aa0a6] hover:bg-white/10"
              >
                ?
              </button>
              <button
                type="button"
                aria-label="Settings"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-xs text-[#9aa0a6] hover:bg-white/10"
              >
                *
              </button>
              <button
                type="button"
                aria-label="Apps"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-xs text-[#9aa0a6] hover:bg-white/10"
              >
                :
              </button>
              <span className="ml-1 h-8 w-8 rounded-full bg-[#8ab4f8]/45" />
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <aside className="w-14 border-r border-white/10 bg-[#171717] pt-4">
              <div className="flex flex-col items-center gap-3 text-[#9aa0a6]">
                <button type="button" className="grid h-9 w-9 place-items-center rounded-xl bg-[#8ab4f8]/25 text-xs">
                  M
                </button>
                <button type="button" className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-xs">
                  C
                </button>
                <button type="button" className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-xs">
                  T
                </button>
              </div>
            </aside>

            <aside className="w-[248px] border-r border-white/10 bg-[#171717] px-3 py-4">
              <button
                type="button"
                onClick={() => setComposeOpen(true)}
                className="mb-5 inline-flex h-14 w-[148px] items-center justify-center rounded-2xl bg-[#c2e7ff] px-5 text-[15px] font-medium text-[#041e49] shadow-[0_1px_2px_rgba(0,0,0,0.3)] hover:bg-[#b7defa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ab4f8]"
              >
                contact
              </button>

              <nav className="space-y-1 text-sm text-[#bdc1c6]">
                <button
                  type="button"
                  className="flex h-8 w-full items-center justify-between rounded-r-full bg-[#10384f] pl-4 pr-3 text-left text-[#d7ecff]"
                >
                  <span>Inbox</span>
                  <span className="text-xs text-[#9fc8ea]">1</span>
                </button>
                <button
                  type="button"
                  className="flex h-8 w-full items-center justify-between rounded-r-full pl-4 pr-3 text-left hover:bg-white/10"
                >
                  <span>Starred</span>
                  <span className="text-xs text-[#9aa0a6]">0</span>
                </button>
                <button
                  type="button"
                  className="flex h-8 w-full items-center justify-between rounded-r-full pl-4 pr-3 text-left hover:bg-white/10"
                >
                  <span>Sent</span>
                  <span className="text-xs text-[#9aa0a6]">0</span>
                </button>
                <button
                  type="button"
                  className="flex h-8 w-full items-center justify-between rounded-r-full pl-4 pr-3 text-left hover:bg-white/10"
                >
                  <span>Drafts</span>
                  <span className="text-xs text-[#9aa0a6]">0</span>
                </button>
              </nav>
            </aside>

            <main className="flex min-w-0 flex-1 flex-col bg-[#111315]">
              <div className="flex h-12 items-end border-b border-white/10 bg-[#1b1c1e] px-4">
                <button
                  type="button"
                  className="flex h-full min-w-[140px] items-center justify-center border-b-2 border-[#8ab4f8] text-sm font-medium text-[#d2e3fc]"
                >
                  Primary
                </button>
                <button
                  type="button"
                  className="flex h-full min-w-[140px] items-center justify-center border-b-2 border-transparent text-sm text-[#9aa0a6] hover:bg-white/5"
                >
                  Promotions
                </button>
                <button
                  type="button"
                  className="flex h-full min-w-[140px] items-center justify-center border-b-2 border-transparent text-sm text-[#9aa0a6] hover:bg-white/5"
                >
                  Social
                </button>
                <button
                  type="button"
                  className="flex h-full min-w-[140px] items-center justify-center border-b-2 border-transparent text-sm text-[#9aa0a6] hover:bg-white/5"
                >
                  Updates
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                <button
                  type="button"
                  className="flex h-11 w-full items-center gap-3 border-b border-white/10 bg-[#151618] px-4 text-left hover:bg-[#1d1f22]"
                >
                  <span className="h-4 w-4 rounded-sm border border-[#5f6368]" />
                  <span className="text-[#5f6368]">*</span>
                  <span className="min-w-[220px] text-sm font-semibold text-[#e8eaed]">Chloe Kang</span>
                  <span className="truncate text-sm text-[#e8eaed]">
                    is excited to connect with you!
                    <span className="ml-2 text-[#9aa0a6]">Lets chat and build something sweet.</span>
                  </span>
                  <span className="ml-4 text-xs text-[#9aa0a6]">12:05 PM</span>
                </button>
              </div>
            </main>
          </div>
        </div>
      </section>

      {composeOpen && (
        <div className="fixed bottom-4 right-6 z-50 flex h-[min(74vh,500px)] w-[min(92vw,540px)] flex-col overflow-hidden rounded-t-2xl border border-white/15 bg-[#1f1f1f] shadow-[0_28px_80px_-32px_rgba(0,0,0,0.9)]">
          <div className="flex h-10 items-center justify-between border-b border-white/10 bg-[#2a2a2a] px-4">
            <span className="text-sm font-medium text-[#e8eaed]">New Message</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Minimize"
                className="grid h-7 w-7 place-items-center rounded text-[#9aa0a6] hover:bg-white/10"
              >
                _
              </button>
              <button
                type="button"
                aria-label="Maximize"
                className="grid h-7 w-7 place-items-center rounded text-[#9aa0a6] hover:bg-white/10"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="grid h-7 w-7 place-items-center rounded text-[#9aa0a6] hover:bg-white/10"
                aria-label="Close compose window"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2]">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="border-b border-white/10 px-4 py-2 text-sm">
            <div className="flex items-center gap-3 border-b border-white/10 py-2">
              <span className="w-14 text-[#9aa0a6]">To</span>
              <input
                value="Chloe Kang"
                readOnly
                className="w-full bg-transparent text-[#e8eaed] outline-none"
                aria-label="To"
              />
            </div>
            <div className="flex items-center gap-3 py-2">
              <span className="w-14 text-[#9aa0a6]">Subject</span>
              <input
                value="Contact details"
                readOnly
                className="w-full bg-transparent text-[#e8eaed] outline-none"
                aria-label="Subject"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-auto px-4 py-4 text-sm leading-relaxed text-[#e8eaed]">
            <p className="font-medium text-[#e8eaed]">Let&apos;s connect:</p>
            <a className="block text-[#8ab4f8] hover:underline" href="mailto:ugcbychloekang@gmail.com">
              Email: ugcbychloekang@gmail.com
            </a>
            <a
              className="block text-[#8ab4f8] hover:underline"
              href="https://www.linkedin.com/in/chloe-kang-234292250"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
            <a
              className="block text-[#8ab4f8] hover:underline"
              href="https://www.instagram.com/imchloekang/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
            <a
              className="block text-[#8ab4f8] hover:underline"
              href="https://www.tiktok.com/@imchloekang"
              target="_blank"
              rel="noreferrer"
            >
              TikTok
            </a>
            <a
              className="block text-[#8ab4f8] hover:underline"
              href="https://x.com/KangChloe"
              target="_blank"
              rel="noreferrer"
            >
              Twitter/X
            </a>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
            <button
              type="button"
              className="rounded-full bg-[#0b57d0] px-5 py-2 text-sm font-medium text-white hover:bg-[#1a66db]"
            >
              Send
            </button>
            <div className="flex items-center gap-2 text-[#9aa0a6]">
              <span className="grid h-7 w-7 place-items-center rounded hover:bg-white/10">A</span>
              <span className="grid h-7 w-7 place-items-center rounded hover:bg-white/10">@</span>
              <span className="grid h-7 w-7 place-items-center rounded hover:bg-white/10">:</span>
              <span className="grid h-7 w-7 place-items-center rounded hover:bg-white/10">#</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChloemailContactExperience;
