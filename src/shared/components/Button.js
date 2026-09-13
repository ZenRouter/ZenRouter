"use client";

import { cn } from "@/shared/utils/cn";

const variants = {
  primary: "bg-brand-500 hover:bg-brand-600 text-white shadow-[var(--shadow-hard-sm)] border border-black/70 dark:border-white/20 disabled:bg-surface-3 disabled:text-text-muted disabled:shadow-none disabled:border-border",
  secondary: "bg-surface hover:bg-surface-2 text-text-main border border-black/70 dark:border-white/20 shadow-[var(--shadow-hard-sm)] disabled:opacity-50 disabled:shadow-none",
  outline: "border border-border text-text-main hover:bg-surface-2 hover:border-brand-500/40",
  ghost: "text-text-muted hover:bg-surface-2 hover:text-text-main",
  danger: "bg-red-500 hover:bg-red-600 text-white shadow-[var(--shadow-hard-sm)] border border-black/70 dark:border-white/20 disabled:bg-surface-3 disabled:text-text-muted disabled:shadow-none",
  success: "bg-green-600 hover:bg-green-700 text-white shadow-[var(--shadow-hard-sm)] border border-black/70 dark:border-white/20 disabled:bg-surface-3 disabled:text-text-muted disabled:shadow-none",
  mint: "bg-mint hover:brightness-105 text-slate-900 shadow-[var(--shadow-hard-sm)] border border-black/70 dark:border-white/20 disabled:opacity-50 disabled:shadow-none font-bold",
  sunburst: "bg-sunburst hover:brightness-105 text-slate-900 shadow-[var(--shadow-hard-sm)] border border-black/70 dark:border-white/20 disabled:opacity-50 disabled:shadow-none font-bold",
  electric: "bg-electric hover:brightness-105 text-white shadow-[var(--shadow-hard-sm)] border border-black/70 dark:border-white/20 disabled:opacity-50 disabled:shadow-none font-bold",
  ember: "bg-ember hover:brightness-105 text-white shadow-[var(--shadow-hard-sm)] border border-black/70 dark:border-white/20 disabled:opacity-50 disabled:shadow-none font-bold",
};

const sizes = {
  sm: "h-7 px-3 text-xs rounded-full",
  md: "h-9 px-4 text-sm rounded-full",
  lg: "h-11 px-6 text-sm rounded-full",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  ...props
}) {
  const isPill = variant !== "ghost" && variant !== "outline";
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-120 ease-out cursor-pointer",
        isPill && "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hard)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="material-symbols-outlined text-[18px]">{iconRight}</span>
      )}
    </button>
  );
}
