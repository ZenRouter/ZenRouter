"use client";

import PropTypes from "prop-types";
import Tooltip from "@/shared/components/Tooltip";
import { fmt, fmtCompact, fmtCost } from "@/shared/utils/format";

export default function OverviewCards({ stats }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {/* 1. Total Requests */}
      <div className="slush-card relative overflow-hidden p-4 flex flex-col justify-between group hover:border-emerald-500/50">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
            Total Requests
          </span>
          <span className="size-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/30">
            <span className="material-symbols-outlined text-[15px]">sync_alt</span>
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight text-text-main group-hover:scale-[1.02] transition-transform">
            {fmt(stats.totalRequests)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-text-muted">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Gateway activity</span>
        </div>
      </div>

      {/* 2. Total Input Tokens */}
      <div className="slush-card relative overflow-hidden p-4 flex flex-col justify-between group hover:border-blue-500/50">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
            Input Tokens
          </span>
          <span className="size-6 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">
            <span className="material-symbols-outlined text-[15px]">input</span>
          </span>
        </div>
        <Tooltip text={`${fmt(stats.totalPromptTokens)} total input tokens`}>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400 group-hover:scale-[1.02] transition-transform">
              {fmtCompact(stats.totalPromptTokens)}
            </span>
          </div>
        </Tooltip>
        <div className="mt-2 text-[11px] font-medium text-text-muted truncate">
          Prompts & contexts
        </div>
      </div>

      {/* 3. Cached Tokens */}
      <div className="slush-card relative overflow-hidden p-4 flex flex-col justify-between group hover:border-purple-500/50">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
            Cached Reads
          </span>
          <span className="size-6 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold border border-purple-500/30">
            <span className="material-symbols-outlined text-[15px]">bolt</span>
          </span>
        </div>
        <Tooltip text={`${fmt(stats.totalCachedTokens)} cached tokens`}>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400 group-hover:scale-[1.02] transition-transform">
              {fmtCompact(stats.totalCachedTokens)}
            </span>
          </div>
        </Tooltip>
        <div className="mt-2 text-[11px] font-semibold text-purple-600 dark:text-purple-300 flex items-center gap-1">
          <span>⚡ Fast prompt cache</span>
        </div>
      </div>

      {/* 4. Output Tokens */}
      <div className="slush-card relative overflow-hidden p-4 flex flex-col justify-between group hover:border-amber-500/50">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
            Output Tokens
          </span>
          <span className="size-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold border border-amber-500/30">
            <span className="material-symbols-outlined text-[15px]">output</span>
          </span>
        </div>
        <Tooltip text={`${fmt(stats.totalCompletionTokens)} output tokens`}>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400 group-hover:scale-[1.02] transition-transform">
              {fmtCompact(stats.totalCompletionTokens)}
            </span>
          </div>
        </Tooltip>
        <div className="mt-2 text-[11px] font-medium text-text-muted truncate">
          Generated completions
        </div>
      </div>

      {/* 5. Est. Cost */}
      <div className="slush-card relative overflow-hidden p-4 flex flex-col justify-between group hover:border-orange-500/50">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
            Est. Cost
          </span>
          <span className="size-6 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold border border-orange-500/30">
            <span className="material-symbols-outlined text-[15px]">payments</span>
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight text-orange-600 dark:text-orange-400 group-hover:scale-[1.02] transition-transform">
            ~{fmtCost(stats.totalCost)}
          </span>
        </div>
        <div className="mt-2 text-[10px] font-medium text-text-muted">
          Estimated spend
        </div>
      </div>
    </div>
  );
}

OverviewCards.propTypes = {
  stats: PropTypes.object.isRequired,
};

OverviewCards.propTypes = {
  stats: PropTypes.object.isRequired,
};
