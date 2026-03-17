import { MobileCollabsExperience } from "@/components/mobile/collabs/MobileCollabsExperience";
import { ExperienceModeSwitch } from "@/lib/experience-mode/ExperienceModeSwitch";
import CollabsRoute from "@/routes/Collabs";

export default function CollabsPage() {
  return (
    <ExperienceModeSwitch
      desktop={<CollabsRoute />}
      mobile={<MobileCollabsExperience />}
    />
  );
}
