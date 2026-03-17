export type ExperienceMode = "desktop" | "mobile";

export type ExperienceOverride = ExperienceMode | null;

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

const MOBILE_USER_AGENT_RE =
  /\b(iPhone|iPod|Android.+Mobile|Windows Phone|webOS|BlackBerry|Opera Mini|Mobile Safari)\b/i;

export function normalizeQueryValue(value?: string | string[]): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

export function getExperienceOverride(value?: string | string[]): ExperienceOverride {
  const normalized = normalizeQueryValue(value)?.toLowerCase();
  if (normalized === "mobile") return "mobile";
  if (normalized === "desktop") return "desktop";
  return null;
}

export function detectExperienceModeFromHeaders(headersLike: { get(name: string): string | null }): ExperienceMode {
  const mobileHint = headersLike.get("sec-ch-ua-mobile");
  if (mobileHint === "?1") {
    return "mobile";
  }

  const userAgent = headersLike.get("user-agent") ?? "";
  if (MOBILE_USER_AGENT_RE.test(userAgent)) {
    return "mobile";
  }

  const viewportWidth = Number.parseInt(headersLike.get("viewport-width") ?? "", 10);
  if (Number.isFinite(viewportWidth) && viewportWidth > 0 && viewportWidth <= 900) {
    return "mobile";
  }

  return "desktop";
}

export function detectExperienceModeFromWindow(): ExperienceMode {
  if (typeof window === "undefined") {
    return "desktop";
  }

  const userAgent = window.navigator.userAgent;
  if (MOBILE_USER_AGENT_RE.test(userAgent)) {
    return "mobile";
  }

  const width = Math.min(window.innerWidth, window.screen?.width ?? window.innerWidth);
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;

  if (width <= 768) {
    return "mobile";
  }

  if (width <= 920 && (coarsePointer || noHover)) {
    return "mobile";
  }

  return "desktop";
}
