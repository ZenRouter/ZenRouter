"use client";

import { useTheme } from "@/shared/hooks/useTheme";
import { cn } from "@/shared/utils/cn";

export default function ThemeToggle({ className, variant = "default" }) {
  const { isDark, toggleTheme } = useTheme();

  const variants = {
    default: cn(
      "flex items-center justify-center size-8 sm:size-9 rounded-full",
      "border-[1.5px] border-black/85 dark:border-white/25 bg-surface",
      "text-text-main shadow-[var(--shadow-hard-sm)] hover:shadow-[var(--shadow-hard)]",
      "hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
      "transition-all cursor-pointer"
    ),
    card: cn(
      "flex items-center justify-center size-9 rounded-full",
      "border-[1.5px] border-black/85 dark:border-white/25 bg-surface",
      "text-text-main shadow-[var(--shadow-hard-sm)] hover:shadow-[var(--shadow-hard)]",
      "hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
      "transition-all cursor-pointer group"
    ),
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(variants[variant], className)}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span
        className={cn(
          "material-symbols-outlined text-[19px]",
          variant === "card" && "transition-transform duration-300 group-hover:rotate-12"
        )}
      >
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
