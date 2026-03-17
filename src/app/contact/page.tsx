import { MobileContactExperience } from "@/components/mobile/contact/MobileContactExperience";
import ContactMissionV6 from "@/components/contact/ContactMissionV6";
import { ExperienceModeSwitch } from "@/lib/experience-mode/ExperienceModeSwitch";

function ContactDesktopPage() {
  return (
    <main className="min-h-screen w-full bg-black">
      <ContactMissionV6 />
    </main>
  );
}

export default function ContactPage() {
  return (
    <ExperienceModeSwitch
      desktop={<ContactDesktopPage />}
      mobile={<MobileContactExperience />}
    />
  );
}
