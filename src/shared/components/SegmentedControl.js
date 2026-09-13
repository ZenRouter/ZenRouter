"use client";

import { cn } from "@/shared/utils/cn";

export default function SegmentedControl({
  options = [],
  value,
  onChange,
  size = "md",
  className,
}) {
  const sizes = {
    sm: "h-7 text-xs",
    md: "h-9 text-sm",
    lg: "h-11 text-base",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center p-1 rounded-full border-[1.5px] border-black/85 dark:border-white/25 bg-surface shadow-[var(--shadow-hard-sm)] overflow-x-auto",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "shrink-0 px-3.5 py-1 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-120 cursor-pointer",
            sizes[size],
            value === option.value
              ? "bg-sunburst text-slate-950 border-[1.5px] border-black shadow-[var(--shadow-hard-sm)]"
              : "text-text-muted hover:text-text-main hover:bg-mist/80 dark:hover:bg-surface-2 border-[1.5px] border-transparent"
          )}
        >
          {option.icon && (
            <span className="material-symbols-outlined text-[15px] mr-1.5 align-middle">
              {option.icon}
            </span>
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}
