"use client";

import { animate, type AnimationPlaybackControls } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const STEP_DEGREES = 72;
const DRAG_SENSITIVITY = 0.34;
const AUTO_ROTATION_DEGREES_PER_SECOND = 18;
const INTERACTION_PAUSE_MS = 2400;

function getActiveIndex(rotation: number, count: number) {
  const rawIndex = Math.round(-rotation / STEP_DEGREES);
  return ((rawIndex % count) + count) % count;
}

export function useContactCarousel(count: number, options?: { autoPlayEnabled?: boolean }) {
  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const autoPlayEnabled = options?.autoPlayEnabled ?? true;

  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const startXRef = useRef(0);
  const startRotationRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const interactionUntilRef = useRef(0);

  const syncRotation = useCallback(
    (nextRotation: number) => {
      rotationRef.current = nextRotation;
      setRotation(nextRotation);
      setActiveIndex(getActiveIndex(nextRotation, count));
    },
    [count],
  );

  const snapToIndex = useCallback(
    (index: number) => {
      const targetRotation = -index * STEP_DEGREES;
      controlsRef.current?.stop();
      controlsRef.current = animate(rotationRef.current, targetRotation, {
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: syncRotation,
      });
    },
    [syncRotation],
  );

  const finishDrag = useCallback(() => {
    const projectedRotation = rotationRef.current + velocityRef.current * 28;
    const snappedIndex = getActiveIndex(projectedRotation, count);
    setIsDragging(false);
    snapToIndex(snappedIndex);
  }, [count, snapToIndex]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      interactionUntilRef.current = performance.now() + INTERACTION_PAUSE_MS;
      pointerIdRef.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      controlsRef.current?.stop();
      setIsDragging(true);
      startXRef.current = event.clientX;
      startRotationRef.current = rotationRef.current;
      lastXRef.current = event.clientX;
      lastTimeRef.current = performance.now();
      velocityRef.current = 0;
      dragDistanceRef.current = 0;
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;

      const dx = event.clientX - startXRef.current;
      const nextRotation = startRotationRef.current + dx * DRAG_SENSITIVITY;
      const now = performance.now();
      const elapsed = Math.max(now - lastTimeRef.current, 1);
      velocityRef.current = (event.clientX - lastXRef.current) / elapsed;
      lastXRef.current = event.clientX;
      lastTimeRef.current = now;
      dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(dx));
      syncRotation(nextRotation);
    },
    [syncRotation],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;
      pointerIdRef.current = null;
      interactionUntilRef.current = performance.now() + INTERACTION_PAUSE_MS;
      finishDrag();
    },
    [finishDrag],
  );

  useEffect(() => {
    if (!autoPlayEnabled || isDragging) return;

    const waitForInteractionPause = Math.max(interactionUntilRef.current - performance.now(), 0);
    const timeoutId = window.setTimeout(() => {
      const startRotation = rotationRef.current;
      controlsRef.current?.stop();
      controlsRef.current = animate(startRotation, startRotation - 360, {
        duration: 360 / AUTO_ROTATION_DEGREES_PER_SECOND,
        ease: "linear",
        repeat: Number.POSITIVE_INFINITY,
        onUpdate: syncRotation,
      });
    }, waitForInteractionPause);

    return () => {
      window.clearTimeout(timeoutId);
      controlsRef.current?.stop();
    };
  }, [autoPlayEnabled, isDragging, syncRotation]);

  return {
    activeIndex,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
    isDragging,
    rotation,
    snapToIndex,
  };
}
