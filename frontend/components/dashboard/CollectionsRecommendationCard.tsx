"use client";

import type { CollectionState } from "@/lib/api/types";

import {
  collectionActionLabel,
  collectionRiskLabel,
} from "./view-models";

interface CollectionsRecommendationCardProps {
  loading?: boolean;
  onApply: () => Promise<void>;
  state: CollectionState | null | undefined;
}

export default function CollectionsRecommendationCard({
  loading,
  onApply,
  state,
}: CollectionsRecommendationCardProps) {
  if (!state) {
    return null;
  }

  const riskLabel = collectionRiskLabel(state.risk_score);
  const actionLabel = collectionActionLabel(state.next_best_action);

  return (
    <div className="rounded-lg border border-border-default bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="m-0 text-lg">Collections Optimizer</h3>
        <span
          className={`rounded-full px-3 py-1 font-mono text-xs font-bold uppercase ${
            state.risk_score >= 70
              ? "bg-red text-white"
              : state.risk_score >= 40
                ? "bg-amber text-black"
                : "bg-green text-black"
          }`}
        >
          {riskLabel}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        <div className="rounded-md border border-border-default bg-white/[0.02] p-3">
          <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim">
            Recommended action
          </div>
          <div>{actionLabel}</div>
        </div>
        <div className="rounded-md border border-border-default bg-white/[0.02] p-3">
          <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim">
            Recommended tone
          </div>
          <div className="capitalize">{state.recommended_tone}</div>
        </div>
        {state.recommended_send_at ? (
          <div className="rounded-md border border-border-default bg-white/[0.02] p-3">
            <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim">
              Recommended send at
            </div>
            <div>{new Date(state.recommended_send_at).toLocaleString("en-ZA")}</div>
          </div>
        ) : null}
      </div>

      {state.reasons.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim">
            Reasons
          </div>
          <ul className="m-0 list-none p-0">
            {state.reasons.map((reason, index) => (
              <li key={index} className="mb-1 text-text-dim">
                <span className="font-mono text-xs text-text-dim">
                  [{reason.code}]
                </span>{" "}
                {reason.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        className="inline-flex items-center gap-2.5 bg-green text-black font-mono text-[13px] font-bold tracking-[0.05em] uppercase px-8 py-4 rounded-[2px] transition-all hover:bg-[#1fffaa] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,230,118,0.3)] border-none cursor-pointer"
        disabled={loading}
        onClick={() => void onApply()}
        type="button"
      >
        <span>{loading ? "Applying..." : "Apply recommendation"}</span>
        <span>✓</span>
      </button>
    </div>
  );
}