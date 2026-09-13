"use client";

import { cn } from "@/shared/utils/cn";

export default function Card({
  children,
  title,
  subtitle,
  icon,
  action,
  padding = "md",
  hover = false,
  elev = false,
  tone = "paper",
  className,
  ...props
}) {
  const paddings = {
    none: "",
    xs: "p-3",
    sm: "p-4",
    md: "p-5 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  const tones = {
    paper: "bg-surface",
    sky: "bg-sky/40 dark:bg-sky/20",
    mint: "bg-mint/15 dark:bg-mint/10",
    lavender: "bg-lavender/25 dark:bg-lavender/15",
    sunburst: "bg-sunburst/20 dark:bg-sunburst/15",
    ember: "bg-ember/15 dark:bg-ember/10",
  };

  return (
    <div
      className={cn(
        tones[tone] || "bg-surface",
        "border border-border/80 dark:border-border",
        elev
          ? "rounded-2xl shadow-[var(--shadow-hard)]"
          : "rounded-2xl shadow-[var(--shadow-soft)]",
        hover && "transition-all duration-150 hover:-translate-y-1 hover:shadow-[var(--shadow-hard-lg)] cursor-pointer",
        paddings[padding],
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 rounded-xl bg-surface-2 border border-border-subtle text-text-muted shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-text-main font-bold tracking-tight">{title}</h3>
              )}
              {subtitle && (
                <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

Card.Section = function CardSection({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "p-4 rounded-[10px]",
        "bg-bg border border-border-subtle",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Row = function CardRow({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "p-3 -mx-3 px-3 transition-colors",
        "border-b border-border-subtle last:border-b-0",
        "hover:bg-surface-2/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

Card.ListItem = function CardListItem({
  children,
  actions,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between p-3 -mx-3 px-3",
        "border-b border-border-subtle last:border-b-0",
        "hover:bg-surface-2/50 transition-colors",
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {actions && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {actions}
        </div>
      )}
    </div>
  );
};
