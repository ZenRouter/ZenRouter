"use client";

import { cn } from "@/shared/utils/cn";

const variants = {
  primary: "bg-slate-950 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 shadow-[var(--shadow-hard-sm)] border-[1.5px] border-black dark:border-white/30 disabled:opacity-50 disabled:shadow-none",
  secondary: "bg-surface hover:bg-surface-2 text-text-main border-[1.5px] border-black/85 dark:border-white/25 shadow-[var(--shadow-hard-sm)] disabled:opacity-50 disabled:shadow-none",
  outline: "border-[1.5px] border-black/80 dark:border-white/25 text-text-main hover:bg-surface-2",
  ghost: "text-text-muted hover:bg-surface-2 hover:text-text-main border border-transparent",
  danger: "bg-ember hover:brightness-105 text-white shadow-[var(--shadow-hard-sm)] border-[1.5px] border-black dark:border-white/20 disabled:opacity-50 disabled:shadow-none",
  success: "bg-mint hover:brightness-105 text-slate-950 shadow-[var(--shadow-hard-sm)] border-[1.5px] border-black dark:border-white/20 disabled:opacity-50 disabled:shadow-none font-bold",
  mint: "bg-mint hover:brightness-105 text-slate-950 shadow-[var(--shadow-hard-sm)] border-[1.5px] border-black dark:border-white/20 disabled:opacity-50 disabled:shadow-none font-bold",
  sunburst: "bg-sunburst hover:brightness-105 text-slate-950 shadow-[var(--shadow-hard-sm)] border-[1.5px] border-black dark:border-white/20 disabled:opacity-50 disabled:shadow-none font-bold",
  electric: "bg-electric hover:brightness-105 text-white shadow-[var(--shadow-hard-sm)] border-[1.5px] border-black dark:border-white/20 disabled:opacity-50 disabled:shadow-none font-bold",
  ember: "bg-ember hover:brightness-105 text-white shadow-[var(--shadow-hard-sm)] border-[1.5px] border-black dark:border-white/20 disabled:opacity-50 disabled:shadow-none font-bold",
};

const sizes = {
  sm: "h-7 px-3.5 text-[11px] rounded-full",
  md: "h-9 px-4 text-xs sm:text-sm rounded-full",
  lg: "h-11 px-6 text-sm sm:text-base rounded-full",
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
        "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-all duration-120 ease-out cursor-pointer",
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
