"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CarouselMetric = {
  focus: number;
  offset: number;
};

export function useContactCarousel(count: number) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [metrics, setMetrics] = useState<CarouselMetric[]>(() =>
    Array.from({ length: count }, (_, index) => ({
      focus: index === 0 ? 1 : 0,
      offset: index,
    })),
  );

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    const nextMetrics: CarouselMetric[] = [];
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < count; index += 1) {
      const node = itemRefs.current[index];
      if (!node) {
        nextMetrics.push({ focus: 0, offset: 1.4 });
        continue;
      }

      const rect = node.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2;
      const distance = itemCenter - containerCenter;
      const normalizedOffset = distance / Math.max(containerRect.width * 0.36, 1);
      const focus = Math.max(0, 1 - Math.min(1.18, Math.abs(normalizedOffset)));
      nextMetrics.push({ focus, offset: normalizedOffset });

      if (Math.abs(distance) < nearestDistance) {
        nearestDistance = Math.abs(distance);
        nearestIndex = index;
      }
    }

    setMetrics(nextMetrics);
    setActiveIndex(nearestIndex);
  }, [count]);

  const requestMeasure = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      measure();
    });
  }, [measure]);

  useEffect(() => {
    requestMeasure();

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", requestMeasure, { passive: true });
    window.addEventListener("resize", requestMeasure);

    return () => {
      container.removeEventListener("scroll", requestMeasure);
      window.removeEventListener("resize", requestMeasure);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [requestMeasure]);

  const setItemRef = useCallback(
    (index: number) => (node: HTMLDivElement | null) => {
      itemRefs.current[index] = node;
      requestMeasure();
    },
    [requestMeasure],
  );

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    const node = itemRefs.current[index];
    if (!container || !node) return;

    const left = node.offsetLeft - container.clientWidth / 2 + node.clientWidth / 2;
    container.scrollTo({
      left,
      behavior: "smooth",
    });
  }, []);

  return useMemo(
    () => ({
      activeIndex,
      containerRef,
      metrics,
      scrollToIndex,
      setItemRef,
    }),
    [activeIndex, metrics, scrollToIndex, setItemRef],
  );
}
