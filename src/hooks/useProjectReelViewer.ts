"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useProjectReelViewer(count: number) {
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const manualPauseSetRef = useRef<Set<number>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeVideoPaused, setActiveVideoPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  const setSlideRef = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      slideRefs.current[index] = node;
    },
    [],
  );

  const setVideoRef = useCallback(
    (index: number) => (node: HTMLVideoElement | null) => {
      videoRefs.current[index] = node;
    },
    [],
  );

  useEffect(() => {
    const slides = slideRefs.current.slice(0, count).filter((slide): slide is HTMLElement => Boolean(slide));
    if (slides.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let nextIndex = activeIndex;
        let nextRatio = 0;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = slideRefs.current.findIndex((slide) => slide === entry.target);
          if (index === -1) continue;
          if (entry.intersectionRatio >= nextRatio) {
            nextRatio = entry.intersectionRatio;
            nextIndex = index;
          }
        }

        if (nextIndex !== activeIndex) {
          setActiveIndex(nextIndex);
        }
      },
      {
        threshold: [0.45, 0.6, 0.75],
      },
    );

    for (const slide of slides) {
      observer.observe(slide);
    }

    return () => observer.disconnect();
  }, [activeIndex, count]);

  useEffect(() => {
    const videos = videoRefs.current.slice(0, count);

    videos.forEach((video, index) => {
      if (!video) return;
      video.muted = muted;
      video.defaultMuted = muted;
      video.loop = true;
      video.playsInline = true;
      video.preload = Math.abs(index - activeIndex) <= 1 ? "metadata" : "none";

      if (index === activeIndex) {
        if (manualPauseSetRef.current.has(index)) {
          video.pause();
          setActiveVideoPaused(true);
          return;
        }

        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            manualPauseSetRef.current.add(index);
            setActiveVideoPaused(true);
          });
        }
        setActiveVideoPaused(false);
        return;
      }

      video.pause();
      if (video.currentTime > 0) {
        video.currentTime = 0;
      }
    });
  }, [activeIndex, count, muted]);

  const toggleMuted = useCallback(() => {
    setMuted((value) => !value);
  }, []);

  const togglePlayback = useCallback(() => {
    const activeVideo = videoRefs.current[activeIndex];
    if (!activeVideo) return;

    if (activeVideo.paused) {
      manualPauseSetRef.current.delete(activeIndex);
      const playPromise = activeVideo.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          manualPauseSetRef.current.add(activeIndex);
          setActiveVideoPaused(true);
        });
      }
      setActiveVideoPaused(false);
    } else {
      manualPauseSetRef.current.add(activeIndex);
      activeVideo.pause();
      setActiveVideoPaused(true);
    }
  }, [activeIndex]);

  return {
    activeIndex,
    activeVideoPaused,
    muted,
    setSlideRef,
    setVideoRef,
    toggleMuted,
    togglePlayback,
  };
}
