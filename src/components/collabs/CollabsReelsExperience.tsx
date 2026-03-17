"use client";

import { MobileCollabsExperience } from "@/components/mobile/collabs/MobileCollabsExperience";
import { ExperienceModeSwitch } from "@/lib/experience-mode/ExperienceModeSwitch";
import ReelsRoute from "@/routes/Reels";

export function CollabsReelsExperience() {
  return (
    <ExperienceModeSwitch
      desktop={<ReelsRoute />}
      mobile={<MobileCollabsExperience skipIntro={true} />}
    />
  );
}
