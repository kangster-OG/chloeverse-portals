"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CampaignDeliverable,
  CampaignStatus,
  CollabsCampaign,
} from "@/lib/collabsCampaigns";
import styles from "./CollabsDashboardGlass.module.css";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatDeliveredOn(value?: string) {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return value;
  const [, y, mo, d] = m;
  return `${y}.${mo}.${d}`;
}

function statusTone(status: CampaignStatus) {
  switch (status) {
    case "Live":
      return "bg-emerald-300/12 text-emerald-100 border-emerald-200/18";
    case "Delivered":
      return "bg-cyan-300/12 text-cyan-100 border-cyan-200/18";
    case "Approved":
      return "bg-violet-300/12 text-violet-100 border-violet-200/18";
    case "In Review":
      return "bg-amber-300/12 text-amber-100 border-amber-200/18";
    case "Renewed":
      return "bg-fuchsia-300/12 text-fuchsia-100 border-fuchsia-200/18";
    default:
      return "bg-white/8 text-white/86 border-white/16";
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function CollabsDashboardGlass({
  campaigns,
  returnUrl,
}: {
  campaigns: CollabsCampaign[];
  returnUrl: string;
}) {
  const allStatuses: CampaignStatus[] = useMemo(
    () => ["Live", "Delivered", "Approved", "In Review", "Renewed", "Draft"],
    []
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CampaignStatus | "All">("All");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null
  );
  const [player, setPlayer] = useState<{
    campaignId: string;
    deliverableId: string;
  } | null>(null);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (campaigns ?? [])
      .filter((c) => (status === "All" ? true : c.status === status))
      .filter((c) => {
        if (!q) return true;
        const hay = `${c.brand?.name ?? ""} ${c.title ?? ""} ${
          c.summary ?? ""
        }`.toLowerCase();
        return hay.includes(q);
      });
  }, [campaigns, query, status]);

  const selectedCampaign = useMemo(() => {
    if (!selectedCampaignId) return null;
    return (
      filtered.find((c) => c.id === selectedCampaignId) ??
      campaigns.find((c) => c.id === selectedCampaignId) ??
      null
    );
  }, [campaigns, filtered, selectedCampaignId]);

  const selectedDeliverable = useMemo(() => {
    if (!player) return null;
    const camp = campaigns.find((c) => c.id === player.campaignId);
    const del = camp?.deliverables?.find((d) => d.id === player.deliverableId);
    return camp && del ? { campaign: camp, deliverable: del } : null;
  }, [campaigns, player]);

  const drawerOpen = Boolean(selectedCampaign);
  const modalOpen = Boolean(selectedDeliverable);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (modalOpen) setPlayer(null);
        else setSelectedCampaignId(null);
      }
      if (!modalOpen) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();

      const camp = selectedDeliverable?.campaign;
      const del = selectedDeliverable?.deliverable;
      if (!camp || !del) return;

      const idx = camp.deliverables.findIndex((x) => x.id === del.id);
      if (idx < 0) return;

      const nextIdx = e.key === "ArrowRight" ? idx + 1 : idx - 1;
      const clamped = clamp(nextIdx, 0, camp.deliverables.length - 1);
      const next = camp.deliverables[clamped];
      if (next) setPlayer({ campaignId: camp.id, deliverableId: next.id });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen, selectedDeliverable]);

  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  const clearAll = () => {
    setQuery("");
    setStatus("All");
    setSelectedCampaignId(null);
    setPlayer(null);
    searchRef.current?.focus();
  };

  const openCampaign = (id: string) => {
    setSelectedCampaignId(id);
    setMobileNavOpen(false);
  };

  const openDeliverable = (campaignId: string, deliverableId: string) => {
    setPlayer({ campaignId, deliverableId });
  };

  const cycleDeliverable = (dir: -1 | 1) => {
    const camp = selectedDeliverable?.campaign;
    const del = selectedDeliverable?.deliverable;
    if (!camp || !del) return;

    const idx = camp.deliverables.findIndex((x) => x.id === del.id);
    if (idx < 0) return;

    const nextIdx = clamp(idx + dir, 0, camp.deliverables.length - 1);
    const next = camp.deliverables[nextIdx];
    if (next) setPlayer({ campaignId: camp.id, deliverableId: next.id });
  };

  return (
    <div className={styles.stage}>
      <div className={styles.bg} />
      <div className={styles.vignette} />
      <div className={styles.grain} />

      <div className="relative z-10 h-screen supports-[height:100svh]:h-[100svh] w-full">
        <div className="mx-auto flex h-full max-w-[1400px] gap-4 px-4 py-4 md:gap-5 md:px-6 md:py-6">
          <aside
            className={cx(
              "hidden md:flex md:flex-col md:w-[290px]",
              styles.glass,
              styles.sheen
            )}
          >
            <div className="flex items-start justify-between px-5 pt-5">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/65">
                  Creator Partnership
                </div>
                <div className="mt-2 text-[1.25rem] font-semibold tracking-tight text-white/92">
                  Collabs Studio
                </div>
              </div>
              <a
                href={returnUrl}
                className="rounded-full border border-white/14 bg-white/6 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
              >
                Return
              </a>
            </div>

            <div className="mt-4 px-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs uppercase tracking-[0.22em] text-white/55">
                  Status
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatus("All")}
                    className={cx(
                      "rounded-full border px-3 py-1 text-xs transition",
                      status === "All"
                        ? "border-white/18 bg-white/10 text-white/90"
                        : "border-white/10 bg-white/4 text-white/65 hover:bg-white/8"
                    )}
                  >
                    All
                  </button>
                  {allStatuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cx(
                        "rounded-full border px-3 py-1 text-xs transition",
                        status === s
                          ? "border-white/18 bg-white/10 text-white/90"
                          : "border-white/10 bg-white/4 text-white/65 hover:bg-white/8"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 px-5">
              <div className="text-xs uppercase tracking-[0.22em] text-white/55">
                Campaigns
              </div>
              <div className="h-px flex-1 bg-white/10" />
              <div className="text-xs text-white/55">{filtered.length}</div>
            </div>

            <div className="mt-3 flex-1 overflow-auto px-3 pb-4">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-sm text-white/60">
                  No campaigns match your filters.
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((c) => {
                    const active = c.id === selectedCampaignId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => openCampaign(c.id)}
                        className={cx(
                          "w-full rounded-2xl border px-4 py-3 text-left transition",
                          active
                            ? "border-white/18 bg-white/10"
                            : "border-white/10 bg-white/5 hover:bg-white/8"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-sm font-semibold tracking-tight text-white/92">
                            {c.brand?.name ?? "BRAND"}
                          </div>
                          <span
                            className={cx(
                              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]",
                              statusTone(c.status)
                            )}
                          >
                            {c.status}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-white/62">
                          {c.title}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
                          <span>{c.platforms.join(" · ")}</span>
                          <span>
                            {c.deliverables.length} deliverable
                            {c.deliverables.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <main className={cx("flex-1 min-w-0", styles.glass, styles.sheen)}>
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:hidden">
              <button
                onClick={() => setMobileNavOpen((v) => !v)}
                className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/85 hover:bg-white/10"
              >
                Menu
              </button>
              <div className="text-xs uppercase tracking-[0.22em] text-white/60">
                Collabs Studio
              </div>
              <a
                href={returnUrl}
                className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/85 hover:bg-white/10"
              >
                Return
              </a>
            </div>

            <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 md:px-6 md:py-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-white/60">
                    Campaign Manager
                  </div>
                  <div className="mt-2 text-[1.35rem] md:text-[1.6rem] font-semibold tracking-tight text-white/92">
                    Sponsored Collaborations
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs text-white/70">
                    Showing: {status === "All" ? "All" : status}
                  </div>
                  <div className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs text-white/70">
                    Total: {filtered.length}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <label className="sr-only" htmlFor="collabs-search">
                    Search campaigns
                  </label>
                  <input
                    id="collabs-search"
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search brand, campaign, summary…"
                    className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white/90 placeholder:text-white/40 outline-none focus:border-white/22 focus:bg-white/8"
                  />
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <button
                    onClick={clearAll}
                    className="rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white/80 hover:bg-white/10"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="h-[calc(100%-152px)] md:h-[calc(100%-160px)] overflow-auto px-4 py-4 md:px-6 md:py-6">
              {filtered.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/70">
                  No campaigns match your search/filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => openCampaign(c.id)}
                      className="group rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/8 hover:border-white/14"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold tracking-tight text-white/92">
                            {c.brand?.name ?? "BRAND"}
                          </div>
                          <div className="mt-1 text-xs text-white/62">
                            {c.title}
                          </div>
                        </div>
                        <span
                          className={cx(
                            "shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]",
                            statusTone(c.status)
                          )}
                        >
                          {c.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-white/55">
                        <div className="rounded-2xl border border-white/10 bg-white/4 px-3 py-2">
                          <div className="text-white/45">Platforms</div>
                          <div className="mt-1 text-white/78">
                            {c.platforms.join(" · ")}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/4 px-3 py-2">
                          <div className="text-white/45">Deliverables</div>
                          <div className="mt-1 text-white/78">
                            {c.deliverables.length}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
                        <span>
                          Delivered: {formatDeliveredOn(c.deliveredOn) || "—"}
                        </span>
                        <span className="opacity-0 transition group-hover:opacity-100">
                          Open →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </main>

          <div
            className={cx(
              "fixed inset-y-0 right-0 z-30 w-full max-w-[520px] p-4 md:p-6 transition-transform duration-300",
              drawerOpen ? "translate-x-0" : "translate-x-full"
            )}
            aria-hidden={!drawerOpen}
          >
            <aside className={cx("h-full w-full", styles.glass, styles.sheen)}>
              {selectedCampaign ? (
                <div className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-5">
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-[0.24em] text-white/60">
                        Campaign Detail
                      </div>
                      <div className="mt-2 text-[1.05rem] font-semibold tracking-tight text-white/92">
                        {selectedCampaign.brand?.name ?? "BRAND"} —{" "}
                        {selectedCampaign.title}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cx(
                            "rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]",
                            statusTone(selectedCampaign.status)
                          )}
                        >
                          {selectedCampaign.status}
                        </span>
                        <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] text-white/70">
                          {selectedCampaign.platforms.join(" · ")}
                        </span>
                        <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] text-white/70">
                          {selectedCampaign.deliverables.length} deliverable
                          {selectedCampaign.deliverables.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCampaignId(null)}
                      className="rounded-2xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/85 hover:bg-white/10"
                    >
                      Close
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto px-5 py-5">
                    {selectedCampaign.summary ? (
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/72">
                        {selectedCampaign.summary}
                      </div>
                    ) : null}

                    <div className="mt-5 flex items-center gap-2">
                      <div className="text-xs uppercase tracking-[0.22em] text-white/55">
                        Deliverables
                      </div>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3">
                      {selectedCampaign.deliverables.map((d) => (
                        <DeliverableRow
                          key={d.id}
                          deliverable={d}
                          onOpen={() => openDeliverable(selectedCampaign.id, d.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-10 text-white/60">
                  Select a campaign to view details.
                </div>
              )}
            </aside>
          </div>
        </div>

        {mobileNavOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-[86%] max-w-[360px] p-4">
              <div className={cx("h-full w-full", styles.glass, styles.sheen)}>
                <div className="flex items-start justify-between px-5 pt-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/65">
                    Collabs Studio
                  </div>
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className="rounded-2xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/85 hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 px-5 text-xs uppercase tracking-[0.22em] text-white/55">
                  Campaigns ({filtered.length})
                </div>

                <div className="mt-3 h-[calc(100%-96px)] overflow-auto px-3 pb-4">
                  <div className="space-y-2">
                    {filtered.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => openCampaign(c.id)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/8"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-sm font-semibold tracking-tight text-white/92">
                            {c.brand?.name ?? "BRAND"}
                          </div>
                          <span
                            className={cx(
                              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]",
                              statusTone(c.status)
                            )}
                          >
                            {c.status}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-white/62">{c.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {selectedDeliverable ? (
          <PlayerModal
            campaign={selectedDeliverable.campaign}
            deliverable={selectedDeliverable.deliverable}
            onClose={() => setPlayer(null)}
            onPrev={() => cycleDeliverable(-1)}
            onNext={() => cycleDeliverable(1)}
            glassClassName={cx(styles.glass, styles.sheen)}
          />
        ) : null}
      </div>
    </div>
  );
}

function DeliverableRow({
  deliverable,
  onOpen,
}: {
  deliverable: CampaignDeliverable;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="group w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/8 hover:border-white/14"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-white/92">
            {deliverable.title}
          </div>
          {deliverable.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {deliverable.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[11px] text-white/70"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <span className="shrink-0 rounded-2xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/80 opacity-90 transition group-hover:opacity-100">
          Preview →
        </span>
      </div>
    </button>
  );
}

function PlayerModal({
  campaign,
  deliverable,
  onClose,
  onPrev,
  onNext,
  glassClassName,
}: {
  campaign: CollabsCampaign;
  deliverable: CampaignDeliverable;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  glassClassName: string;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
        <div className={cx("w-full max-w-[1050px] overflow-hidden", glassClassName)}>
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.24em] text-white/60">
                {campaign.brand?.name ?? "BRAND"} · {campaign.title}
              </div>
              <div className="mt-2 truncate text-sm font-semibold tracking-tight text-white/92">
                {deliverable.title}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onPrev}
                className="rounded-2xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/85 hover:bg-white/10"
              >
                ← Prev
              </button>
              <button
                onClick={onNext}
                className="rounded-2xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/85 hover:bg-white/10"
              >
                Next →
              </button>
              <button
                onClick={onClose}
                className="rounded-2xl border border-white/12 bg-white/6 px-3 py-2 text-xs text-white/85 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[1.45fr_0.85fr]">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40">
              <video
                src={deliverable.mp4Url}
                className="h-full w-full object-contain"
                controls
                playsInline
                preload="metadata"
              />
            </div>

            <div className="space-y-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/55">
                  Campaign
                </div>
                <div className="mt-2 text-sm text-white/78">
                  Status: <span className="text-white/92">{campaign.status}</span>
                </div>
                <div className="mt-1 text-sm text-white/78">
                  Platforms:{" "}
                  <span className="text-white/92">{campaign.platforms.join(" · ")}</span>
                </div>
                <div className="mt-1 text-sm text-white/78">
                  Delivered:{" "}
                  <span className="text-white/92">
                    {formatDeliveredOn(campaign.deliveredOn) || "—"}
                  </span>
                </div>
              </div>

              {deliverable.tags?.length ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-white/55">
                    Tags
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {deliverable.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[11px] text-white/70"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {deliverable.caption ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-white/55">
                    Notes
                  </div>
                  <div className="mt-2 text-sm text-white/72">{deliverable.caption}</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
