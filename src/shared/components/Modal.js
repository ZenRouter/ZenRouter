"use client";

import { useEffect } from "react";
import { cn } from "@/shared/utils/cn";
import Button from "./Button";
import Tooltip from "./Tooltip";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
  showTrafficLights = true,
  className,
}) {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* Modal content */}
      <div
        className={cn(
          "relative w-full bg-surface",
          "border-[2px] border-black/85 dark:border-white/25",
          "rounded-2xl shadow-[var(--shadow-hard-lg)]",
          "fade-in overflow-hidden",
          sizes[size],
          className
        )}
      >
        {/* Header */}
        {(title || showTrafficLights) && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b-[1.5px] border-black/85 dark:border-white/20 bg-surface-2/50">
            <div className="flex items-center">
              {/* Traffic lights — desktop only */}
              {showTrafficLights && (
                <div className="hidden md:flex items-center gap-2 mr-4">
                  <Tooltip text="Close" position="top" color="#FF5F56">
                    <button
                      onClick={onClose}
                      aria-label="Close"
                      title="Close"
                      className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-black/60 dark:border-white/20 hover:brightness-90 transition-all cursor-pointer flex items-center justify-center group/dot"
                    >
                      <span className="text-[8px] font-bold text-white opacity-0 group-hover/dot:opacity-100 transition-opacity leading-none">✕</span>
                    </button>
                  </Tooltip>
                  <div className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-black/60 dark:border-white/20 opacity-80" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-black/60 dark:border-white/20 opacity-80" />
                </div>
              )}
              {title && (
                <h2 className="text-base sm:text-lg font-black tracking-tight text-text-main">{title}</h2>
              )}
            </div>
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="size-7 rounded-full border-[1.5px] border-black/85 dark:border-white/25 bg-surface text-text-muted hover:text-text-main hover:bg-mist dark:hover:bg-surface-2 shadow-[var(--shadow-hard-sm)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] font-bold">close</span>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5 sm:p-6 max-h-[calc(85vh-100px)] overflow-y-auto custom-scrollbar">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t-[1.5px] border-black/85 dark:border-white/20 bg-surface-2/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-text-muted">{message}</p>
    </Modal>
  );
}
