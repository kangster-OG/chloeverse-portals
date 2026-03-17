"use client";

import { useEffect } from "react";
import { MobileCollabsExperience } from "@/components/mobile/collabs/MobileCollabsExperience";
import { ExperienceModeSwitch } from "@/lib/experience-mode/ExperienceModeSwitch";
import ReelsRoute from "@/routes/Reels";

export function CollabsReelsExperience() {
  useEffect(() => {
    for (const overlayId of ["portal-whiteout-overlay-top", "portal-whiteout-overlay"]) {
      const overlay = document.getElementById(overlayId);
      if (!overlay) continue;
      overlay.remove();
    }
  }, []);

  return (
    <ExperienceModeSwitch
      desktop={<ReelsRoute />}
      mobile={<MobileCollabsExperience skipIntro={true} />}
    />
  );
}
