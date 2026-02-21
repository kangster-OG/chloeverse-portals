"use client";

import { useState } from "react";
import { ReelsDesktop } from "@/components/projects/reels/ReelsDesktop";
import { XpDesktop } from "@/components/projects/xp/XpDesktop";

export default function ProjectsPage() {
  const [mode, setMode] = useState<"xp" | "reels">("xp");

  if (mode === "xp") {
    return <XpDesktop onOpen={() => setMode("reels")} />;
  }

  return <ReelsDesktop />;
}
