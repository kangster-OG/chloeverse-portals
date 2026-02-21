import { CollabsFilmCinema } from "@/components/collabs/CollabsFilmCinema";
import { collabsFilmItems } from "@/lib/collabsFilmData";

type SearchParams = Record<string, string | string[] | undefined>;

function getReturnUrl(searchParams?: SearchParams) {
  const raw = searchParams?.return;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return "https://imchloekang.com";
  const trimmed = value.trim();
  // Simple safety: only allow https URLs.
  if (!trimmed.startsWith("https://")) return "https://imchloekang.com";
  return trimmed;
}

export default async function CollabsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolvedSearchParams = (await searchParams) ?? undefined;
  const returnUrl = getReturnUrl(resolvedSearchParams);
  return <CollabsFilmCinema items={collabsFilmItems} returnUrl={returnUrl} />;
}
