import CollabsShell from "@/components/collabs/CollabsShell";
import { Suspense } from "react";

export default function CollabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <CollabsShell>{children}</CollabsShell>
    </Suspense>
  );
}
