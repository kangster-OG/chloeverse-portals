import Link from "next/link";

import { MobileScaffold } from "@/components/mobile/shared/MobileScaffold";

export function MobileLockedPortalExperience({
  currentPath,
  eyebrow,
  title,
  description,
}: {
  currentPath: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <MobileScaffold
      currentPath={currentPath}
      eyebrow={eyebrow}
      title={title}
      description={description}
    >
      <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.06] p-6">
        <div className="absolute inset-0" />
        <div className="relative">
          <div className="mx-auto grid h-36 w-36 place-items-center rounded-full border border-white/12 bg-black/20 shadow-[0_24px_80px_rgba(116,150,255,0.14)]">
            <div className="grid h-16 w-16 place-items-center rounded-full border border-white/20 bg-white/10 text-2xl text-white/72">
              •
            </div>
          </div>
          <p className="mt-6 text-center text-sm leading-6 text-white/68">
            This portal stays closed on handheld for now. Mobile visitors can enter through Projects, Collabs, and Contact.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/10 px-5 py-4 text-[0.72rem] uppercase tracking-[0.28em] text-white"
            >
              Return to the Chloeverse
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center rounded-full border border-white/12 bg-black/25 px-5 py-4 text-[0.72rem] uppercase tracking-[0.28em] text-white/76"
            >
              Open Projects
            </Link>
          </div>
        </div>
      </section>
    </MobileScaffold>
  );
}
