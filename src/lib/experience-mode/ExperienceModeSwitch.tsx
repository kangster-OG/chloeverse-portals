"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";

import {
  detectExperienceModeFromWindow,
  type ExperienceMode,
  getExperienceOverride,
} from "./shared";

function computeMode(override: ExperienceMode | null): ExperienceMode {
  return override ?? detectExperienceModeFromWindow();
}

export function ExperienceModeSwitch({
  desktop,
  mobile,
  fallback,
}: {
  desktop: ReactNode;
  mobile: ReactNode;
  fallback?: ReactNode;
}) {
  const [override, setOverride] = useState<ExperienceMode | null>(null);
  const [mode, setMode] = useState<ExperienceMode | null>(null);

  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextOverride = getExperienceOverride(params.get("view") ?? undefined);
    setOverride(nextOverride);
    setMode(computeMode(nextOverride));
  }, []);

  useEffect(() => {
    if (override) {
      setMode(override);
      return;
    }

    const onChange = () => {
      setMode(computeMode(null));
    };

    const mediaQueries = [
      window.matchMedia("(pointer: coarse)"),
      window.matchMedia("(hover: none)"),
      window.matchMedia("(max-width: 768px)"),
      window.matchMedia("(max-width: 920px)"),
    ];

    for (const query of mediaQueries) {
      query.addEventListener("change", onChange);
    }
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);

    return () => {
      for (const query of mediaQueries) {
        query.removeEventListener("change", onChange);
      }
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, [override]);

  if (mode === null) {
    return (
      fallback ?? (
        <div className="min-h-[100svh] bg-[radial-gradient(circle_at_50%_18%,rgba(102,140,255,0.18),rgba(5,7,17,0)_36%),linear-gradient(180deg,#0b1020_0%,#050711_100%)]" />
      )
    );
  }

  return <>{mode === "mobile" ? mobile : desktop}</>;
}
