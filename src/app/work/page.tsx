import { MobileLockedPortalExperience } from "@/components/mobile/shared/MobileLockedPortalExperience";
import { ExperienceModeSwitch } from "@/lib/experience-mode/ExperienceModeSwitch";

function WorkDesktopPage() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <iframe
        src="/work-retro/index.html"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
        title="Work"
        allow="fullscreen"
      />
    </div>
  );
}

export default function WorkPage() {
  return (
    <ExperienceModeSwitch
      desktop={<WorkDesktopPage />}
      mobile={
        <MobileLockedPortalExperience
          currentPath="/work"
          eyebrow="Desktop Archive"
          title="Work"
          description="This route no longer opens the work dossier on mobile."
        />
      }
    />
  );
}
