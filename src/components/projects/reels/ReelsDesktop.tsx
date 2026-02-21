"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CommentIcon,
  HeartIcon,
  HomeIcon,
  InstagramNavIcon,
  MessagesIcon,
  MoreIcon,
  PlusIcon,
  ProfileIcon,
  ReelsIcon,
  SaveIcon,
  SearchIcon,
  ShareIcon,
  VolumeOffIcon,
  VolumeOnIcon,
} from "@/components/projects/reels/icons";

type Reel = {
  id: string;
  src: string;
  user: string;
  caption: string;
};

const REELS: Reel[] = [
  { id: "r1", src: "/reels/1.mp4", user: "edemmii", caption: "Free will and HTML strike again." },
  { id: "r2", src: "/reels/2.mp4", user: "chloeverse", caption: "Dream logic, but in 9:16." },
  { id: "r3", src: "/reels/3.mp4", user: "saturnwave", caption: "Pixels and poetry in one timeline." },
  { id: "r4", src: "/reels/4.mp4", user: "orbitalcat", caption: "This reel is a portal preview." },
  { id: "r5", src: "/reels/5.mp4", user: "moonbyte", caption: "Building universes one frame at a time." },
  { id: "r6", src: "/reels/6.mp4", user: "archivist", caption: "Upload the MP4 and the spell completes." },
];

const WHEEL_THRESHOLD = 45;
const WHEEL_LOCK_MS = 550;

export function ReelsDesktop() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [failedReels, setFailedReels] = useState<Record<string, boolean>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wheelAccumRef = useRef(0);
  const wheelResetTimerRef = useRef<number | null>(null);
  const lastWheelNavRef = useRef(0);

  const activeReel = REELS[currentIndex];
  const hasVideoFailed = Boolean(failedReels[activeReel.id]);
  const maxIndex = REELS.length - 1;

  const moveNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    setPlaying(true);
  };

  const movePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setPlaying(true);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasVideoFailed) return;
    video.muted = muted;
    if (!playing) {
      video.pause();
      return;
    }
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }, [currentIndex, hasVideoFailed, muted, playing]);

  useEffect(
    () => () => {
      if (wheelResetTimerRef.current) {
        window.clearTimeout(wheelResetTimerRef.current);
      }
    },
    []
  );

  const actionStat = useMemo(
    () => [
      { icon: HeartIcon, count: "12.4K" },
      { icon: CommentIcon, count: "884" },
      { icon: ShareIcon, count: "1.9K" },
      { icon: SaveIcon, count: "3.2K" },
      { icon: MoreIcon, count: "" },
    ],
    []
  );

  return (
    <main
      className="relative h-screen w-full overflow-hidden bg-[#0b0f14] text-white supports-[height:100svh]:h-[100svh]"
      onWheel={(event) => {
        event.preventDefault();
        wheelAccumRef.current += event.deltaY;

        if (wheelResetTimerRef.current) {
          window.clearTimeout(wheelResetTimerRef.current);
        }
        wheelResetTimerRef.current = window.setTimeout(() => {
          wheelAccumRef.current = 0;
        }, 180);

        if (Math.abs(wheelAccumRef.current) < WHEEL_THRESHOLD) return;

        const now = Date.now();
        if (now - lastWheelNavRef.current < WHEEL_LOCK_MS) return;

        if (wheelAccumRef.current > 0) {
          moveNext();
        } else {
          movePrev();
        }
        wheelAccumRef.current = 0;
        lastWheelNavRef.current = now;
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_56%_47%,rgba(64,86,119,0.38)_0%,rgba(11,15,20,0.82)_46%,rgba(11,15,20,1)_76%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0)_40%)]" />

      <div className="relative z-10 flex h-full w-full">
        <aside className="relative flex h-full w-[86px] shrink-0 flex-col items-center border-r border-white/10 bg-black/35 py-5 backdrop-blur-md sm:w-[92px]">
          <button
            type="button"
            aria-label="Go to chloeverse.io"
            onClick={() => window.location.assign("https://chloeverse.io")}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/6 text-white transition hover:bg-white/12"
          >
            <InstagramNavIcon size={26} />
          </button>

          <div className="pointer-events-none mt-10 flex flex-col items-center gap-6 text-white/88">
            <HomeIcon size={25} />
            <SearchIcon size={25} />
            <ReelsIcon size={25} />
            <MessagesIcon size={25} />
            <HeartIcon size={25} />
            <PlusIcon size={25} />
          </div>

          <div className="pointer-events-none mt-auto pb-3 text-white/88">
            <ProfileIcon size={26} />
          </div>
        </aside>

        <section className="relative flex min-w-0 flex-1 items-center justify-center px-4 md:px-8 lg:px-14">
          <div className="flex items-center gap-4 sm:gap-6 lg:gap-10">
            <div className="relative">
              <div className="pointer-events-none absolute inset-[-30px] rounded-[46px] bg-[radial-gradient(circle_at_50%_38%,rgba(132,171,238,0.24),rgba(0,0,0,0)_68%)] blur-xl" />

              <div className="relative h-[86vh] min-h-[560px] max-h-[760px] w-auto aspect-[608/1000] overflow-hidden rounded-[34px] border border-white/16 bg-[#090c12] p-3 shadow-[0_24px_95px_rgba(0,0,0,0.7)] md:h-[92vh] md:min-h-[740px] md:max-h-[980px] md:p-4">
                <div className="relative mx-auto h-full aspect-[9/16] overflow-hidden rounded-[28px] bg-black">
                  <button
                    type="button"
                    aria-label={muted ? "Unmute reel" : "Mute reel"}
                    onClick={(event) => {
                      event.stopPropagation();
                      setMuted((prev) => !prev);
                    }}
                    className="absolute right-3 top-3 z-30 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur"
                  >
                    {muted ? <VolumeOffIcon size={18} /> : <VolumeOnIcon size={18} />}
                  </button>

                  {hasVideoFailed ? (
                    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_45%),linear-gradient(155deg,#2f3f63_0%,#1a2341_52%,#0b1020_100%)] p-8 text-center">
                      <div className="max-w-[78%] rounded-2xl border border-white/20 bg-black/35 px-6 py-5 backdrop-blur">
                        <div className="text-xs uppercase tracking-[0.14em] text-white/65">Video Placeholder</div>
                        <div className="mt-3 text-sm font-semibold text-white">MP4 placeholder - upload later</div>
                        <div className="mt-2 text-xs text-white/65">{activeReel.src}</div>
                      </div>
                    </div>
                  ) : (
                    <video
                      key={activeReel.id}
                      ref={videoRef}
                      src={activeReel.src}
                      className="h-full w-full cursor-pointer object-cover"
                      autoPlay
                      loop
                      muted={muted}
                      playsInline
                      preload="metadata"
                      onClick={() => setPlaying((prev) => !prev)}
                      onError={() => {
                        setFailedReels((prev) => ({ ...prev, [activeReel.id]: true }));
                        setPlaying(false);
                      }}
                    />
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(255,255,255,0.12),rgba(0,0,0,0)_40%),linear-gradient(180deg,rgba(0,0,0,0)_48%,rgba(0,0,0,0.64)_100%)]" />

                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-5">
                    <div className="rounded-2xl border border-white/14 bg-black/35 px-4 py-3 backdrop-blur-md">
                      <div className="text-sm font-semibold text-white/95">@{activeReel.user}</div>
                      <p className="mt-1 text-xs text-white/80">{activeReel.caption}</p>
                      <div className="mt-2 text-[11px] text-white/58">
                        {currentIndex + 1}/{REELS.length}
                      </div>
                    </div>
                  </div>

                  {!hasVideoFailed && !playing ? (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center">
                      <div className="rounded-full border border-white/35 bg-black/45 px-4 py-2 text-xs tracking-[0.14em] text-white/90 backdrop-blur">
                        PAUSED
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="pointer-events-none flex flex-col items-center gap-4 self-center text-white/92">
              {actionStat.map(({ icon: Icon, count }, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <div className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/35 backdrop-blur">
                    <Icon size={20} />
                  </div>
                  {count ? <div className="text-[10px] font-medium text-white/72">{count}</div> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3 sm:right-5 md:right-8">
            <button
              type="button"
              aria-label="Previous reel"
              onClick={movePrev}
              disabled={currentIndex <= 0}
              className={`grid h-11 w-11 place-items-center rounded-full border transition ${
                currentIndex <= 0
                  ? "cursor-not-allowed border-white/10 bg-white/5 text-white/28"
                  : "border-white/25 bg-black/45 text-white hover:bg-black/60"
              }`}
            >
              <ChevronUpIcon size={21} />
            </button>
            <button
              type="button"
              aria-label="Next reel"
              onClick={moveNext}
              disabled={currentIndex >= maxIndex}
              className={`grid h-11 w-11 place-items-center rounded-full border transition ${
                currentIndex >= maxIndex
                  ? "cursor-not-allowed border-white/10 bg-white/5 text-white/28"
                  : "border-white/25 bg-black/45 text-white hover:bg-black/60"
              }`}
            >
              <ChevronDownIcon size={21} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.location.assign("https://imchloekang.com")}
            className="absolute bottom-5 right-4 z-20 rounded-full border border-white/20 bg-[#f8f8f8] px-4 py-2 text-xs font-semibold text-[#121212] shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition hover:bg-white sm:bottom-7 sm:right-6 md:right-9"
          >
            Return to Candy Castle
          </button>
        </section>
      </div>
    </main>
  );
}
