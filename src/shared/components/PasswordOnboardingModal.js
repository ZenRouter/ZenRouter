"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Button from "./Button";

export default function PasswordOnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user already dismissed the prompt in this browser session
    const dismissed = sessionStorage.getItem("zenrouter_pwd_onboarding_dismissed");
    if (dismissed) {
      setLoading(false);
      return;
    }

    // Check password state from settings
    fetch("/api/settings")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to check status");
        return res.json();
      })
      .then((data) => {
        // If password is not set yet (using default 12345678)
        if (data && data.hasPassword === false) {
          setIsOpen(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("zenrouter_pwd_onboarding_dismissed", "true");
    setIsOpen(false);
  };

  const handleGoToSettings = () => {
    sessionStorage.setItem("zenrouter_pwd_onboarding_dismissed", "true");
    setIsOpen(false);
    router.push("/dashboard/profile#password");
  };

  if (loading || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={handleDismiss}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-[var(--shadow-elev)] overflow-hidden animate-in zoom-in-95 duration-200 z-10">
        {/* Glow Accents */}
        <div className="absolute -top-16 -right-16 size-40 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 size-40 bg-accent-sun/15 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 sm:p-8 flex flex-col items-center text-center">
          {/* Logo Badge */}
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-surface-2 border border-border p-3 mb-5 shadow-[var(--shadow-warm)]">
            <Image src="/icons/logo.svg" alt="ZenRouter" width={38} height={38} className="w-full h-full object-contain" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-sun/15 text-accent-sun border border-accent-sun/25 mb-3">
            <span className="size-1.5 rounded-full bg-accent-sun animate-pulse" />
            Security Setup
          </span>

          <h2 className="text-2xl font-bold tracking-tight text-text-main mb-2">
            Welcome to ZenRouter!
          </h2>

          <p className="text-sm text-text-muted leading-relaxed mb-6">
            Your gateway is currently running on the default password (<code className="bg-surface-2 border border-border px-1.5 py-0.5 rounded font-mono font-bold text-text-main">12345678</code>). To keep your AI accounts, API keys, and endpoints secure, please set a custom password.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <Button
              variant="primary"
              onClick={handleGoToSettings}
              className="w-full h-11 text-sm font-semibold shadow-[var(--shadow-warm)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">lock_reset</span>
              Update Password Now
            </Button>
            <Button
              variant="secondary"
              onClick={handleDismiss}
              className="w-full sm:w-auto h-11 px-5 text-sm text-text-muted hover:text-text-main cursor-pointer"
            >
              Remind Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
