"use client";

import { cn } from "@/shared/utils/cn";

const variants = {
  default: "bg-surface-2 text-text-muted border border-border",
  primary: "bg-brand-500/15 text-brand-600 dark:text-brand-300 border border-brand-500/30",
  success: "bg-mint/20 text-emerald-800 dark:text-mint border border-emerald-500/30",
  warning: "bg-sunburst/25 text-amber-900 dark:text-sunburst border border-amber-500/35",
  error: "bg-ember/15 text-red-600 dark:text-ember border border-red-500/30",
  info: "bg-electric/15 text-blue-700 dark:text-electric border border-blue-500/30",
  mint: "bg-mint text-slate-950 border border-black/70 dark:border-white/20 font-bold shadow-xs",
  sunburst: "bg-sunburst text-slate-950 border border-black/70 dark:border-white/20 font-bold shadow-xs",
  electric: "bg-electric text-white border border-black/70 dark:border-white/20 font-bold shadow-xs",
  ember: "bg-ember text-white border border-black/70 dark:border-white/20 font-bold shadow-xs",
};

const sizes = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-[11px]",
  lg: "px-3.5 py-1 text-xs",
};

export default function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  icon,
  className,
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.04em] font-mono",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "size-1.5 rounded-full",
            variant === "success" && "bg-green-500",
            variant === "warning" && "bg-yellow-500",
            variant === "error" && "bg-red-500",
            variant === "info" && "bg-blue-500",
            variant === "primary" && "bg-brand-500",
            variant === "default" && "bg-gray-500"
          )}
        />
      )}
      {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
      {children}
    </span>
  );
}
