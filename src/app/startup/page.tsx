import { MobileStartupExperience } from "@/components/mobile/startup/MobileStartupExperience";
import { StartupExperience } from "@/components/startup/StartupExperience";
import { ExperienceModeSwitch } from "@/lib/experience-mode/ExperienceModeSwitch";
import { Anton, IBM_Plex_Mono } from "next/font/google";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export default function StartupPage() {
  return (
    <ExperienceModeSwitch
      desktop={
        <StartupExperience
          titleFontClassName={anton.className}
          monoFontClassName={ibmPlexMono.className}
        />
      }
      mobile={
        <MobileStartupExperience
          titleFontClassName={anton.className}
          monoFontClassName={ibmPlexMono.className}
        />
      }
    />
  );
}
