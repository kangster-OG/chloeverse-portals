import { MobileStartupExperience } from "@/components/mobile/startup/MobileStartupExperience";
import { StartupExperience } from "@/components/startup/StartupExperience";
import { ExperienceModeSwitch } from "@/lib/experience-mode/ExperienceModeSwitch";

export default function StartupPage() {
  return (
    <ExperienceModeSwitch
      desktop={<StartupExperience />}
      mobile={<MobileStartupExperience />}
    />
  );
}
