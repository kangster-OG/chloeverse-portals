import { MobileProjectsExperience } from "@/components/mobile/projects/MobileProjectsExperience";
import { ProjectsDesktopRoute } from "@/components/projects/ProjectsDesktopRoute";
import { ExperienceModeSwitch } from "@/lib/experience-mode/ExperienceModeSwitch";

export default function ProjectsPage() {
  return (
    <ExperienceModeSwitch
      desktop={<ProjectsDesktopRoute />}
      mobile={<MobileProjectsExperience />}
    />
  );
}
