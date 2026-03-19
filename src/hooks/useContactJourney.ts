"use client";

import { animate, useMotionValue, useReducedMotion, type AnimationPlaybackControls } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { CONTACT_JOURNEY_STOPS } from "@/lib/mobile-content";

const JOURNEY_DURATION_SECONDS = 9.2;
const IMPACT_FLASH_MS = 360;
const FINAL_IMPACT_PROGRESS = 0.965;
const FINAL_FLASH_MS = 560;

type JourneyState = "playing" | "finished";

export function useContactJourney() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const progress = useMotionValue(prefersReducedMotion ? 1 : 0);
  const [journeyState, setJourneyState] = useState<JourneyState>(prefersReducedMotion ? "finished" : "playing");
  const [revealedStopIds, setRevealedStopIds] = useState<string[]>(
    prefersReducedMotion ? CONTACT_JOURNEY_STOPS.map((stop) => stop.id) : [],
  );
  const [activeImpactId, setActiveImpactId] = useState<string | null>(null);
  const [finalImpactActive, setFinalImpactActive] = useState(prefersReducedMotion);

  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimeline = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    for (const timer of timersRef.current) {
      window.clearTimeout(timer);
    }
    timersRef.current = [];
  }, []);

  const finishJourney = useCallback(
    (flashFinalImpact: boolean) => {
      clearTimeline();
      progress.set(1);
      setJourneyState("finished");
      setRevealedStopIds(CONTACT_JOURNEY_STOPS.map((stop) => stop.id));
      setActiveImpactId(null);
      setFinalImpactActive(flashFinalImpact);

      if (flashFinalImpact) {
        const timer = window.setTimeout(() => {
          setFinalImpactActive(false);
        }, FINAL_FLASH_MS);
        timersRef.current.push(timer);
      }
    },
    [clearTimeline, progress],
  );

  const startJourney = useCallback(() => {
    clearTimeline();

    if (prefersReducedMotion) {
      finishJourney(false);
      return;
    }

    progress.set(0);
    setJourneyState("playing");
    setRevealedStopIds([]);
    setActiveImpactId(null);
    setFinalImpactActive(false);

    controlsRef.current = animate(progress, 1, {
      duration: JOURNEY_DURATION_SECONDS,
      ease: "linear",
    });

    for (const stop of CONTACT_JOURNEY_STOPS) {
      const revealTimer = window.setTimeout(() => {
        setRevealedStopIds((current) => (current.includes(stop.id) ? current : [...current, stop.id]));
        setActiveImpactId(stop.id);

        const clearImpactTimer = window.setTimeout(() => {
          setActiveImpactId((current) => (current === stop.id ? null : current));
        }, IMPACT_FLASH_MS);
        timersRef.current.push(clearImpactTimer);
      }, stop.hitProgress * JOURNEY_DURATION_SECONDS * 1000);

      timersRef.current.push(revealTimer);
    }

    const finalImpactTimer = window.setTimeout(() => {
      setFinalImpactActive(true);

      const clearFlashTimer = window.setTimeout(() => {
        setFinalImpactActive(false);
      }, FINAL_FLASH_MS);
      timersRef.current.push(clearFlashTimer);
    }, FINAL_IMPACT_PROGRESS * JOURNEY_DURATION_SECONDS * 1000);

    const finishTimer = window.setTimeout(() => {
      setJourneyState("finished");
      setActiveImpactId(null);
    }, JOURNEY_DURATION_SECONDS * 1000);

    timersRef.current.push(finalImpactTimer, finishTimer);
  }, [clearTimeline, finishJourney, prefersReducedMotion, progress]);

  useEffect(() => {
    startJourney();
    return clearTimeline;
  }, [clearTimeline, startJourney]);

  return {
    activeImpactId,
    finalImpactActive,
    isPlaying: journeyState === "playing",
    journeyState,
    prefersReducedMotion,
    progress,
    replayJourney: startJourney,
    revealedStopIds,
    skipJourney: () => finishJourney(true),
  };
}
