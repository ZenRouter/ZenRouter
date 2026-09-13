"use client";

import { Input } from "@/shared/components";

/** Reusable endpoint row component */
export default function EndpointRow({ label, url, copyId, copied, onCopy, badge, actions }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full shrink-0 min-w-[92px] text-center border border-black/80 dark:border-white/20 shadow-xs ${
          (badge === "CF" || badge === "TS") ? "bg-sunburst text-slate-950" : "bg-surface-2 text-text-main"
        }`}>{label}</span>
      <Input value={url} readOnly className="flex-1 font-mono text-xs sm:text-sm" />
      <button
        onClick={() => onCopy(url, copyId)}
        className="size-9 rounded-full border-[1.5px] border-black/85 dark:border-white/25 bg-surface text-text-main shadow-[var(--shadow-hard-sm)] hover:shadow-[var(--shadow-hard)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center shrink-0 cursor-pointer"
        title="Copy URL"
      >
        <span className="material-symbols-outlined text-[17px] font-bold">{copied === copyId ? "check" : "content_copy"}</span>
      </button>
      {actions}
    </div>
  );
}
