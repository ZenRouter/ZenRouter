"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils/cn";
import { APP_CONFIG, UPDATER_CONFIG } from "@/shared/constants/config";
import { MEDIA_PROVIDER_KINDS } from "@/shared/constants/providers";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";
import Button from "./Button";
import { ConfirmModal } from "./Modal";

// const VISIBLE_MEDIA_KINDS = ["embedding", "image", "imageToText", "tts", "stt", "webSearch", "webFetch", "video", "music"];
const VISIBLE_MEDIA_KINDS = ["embedding", "image", "video", "tts", "stt"];
// Combined entry: webSearch + webFetch share one page at /dashboard/media-providers/web
const COMBINED_WEB_ITEM = { id: "web", label: "Web Fetch & Search", icon: "travel_explore", href: "/dashboard/media-providers/web" };

const navItems = [
  { href: "/dashboard/endpoint", label: "Endpoint & Key", icon: "vpn_key" },
  { href: "/dashboard/providers", label: "Providers", icon: "deployed_code" },
  // { href: "/dashboard/basic-chat", label: "Basic Chat", icon: "chat" }, // Hidden
  { href: "/dashboard/combos", label: "Combo & Vision Adapter", icon: "layers" },
  { href: "/dashboard/usage", label: "Usage", icon: "bar_chart" },
  { href: "/dashboard/quota", label: "Quota Tracker", icon: "donut_small" },
  { href: "/dashboard/token-saver", label: "Token Saver", icon: "tune" },
  // { href: "/dashboard/pxpipe", label: "PXPIPE", icon: "image" },
  { href: "/dashboard/cli-tools", label: "CLI Tools", icon: "code" },
];

const debugItems = [
  { href: "/dashboard/console-log", label: "Console Log", icon: "terminal" },
  { href: "/dashboard/translator", label: "Translator", icon: "translate" },
];

const systemItems = [
  { href: "/dashboard/proxy-pools", label: "Proxy Pools", icon: "lan" },
  { href: "/dashboard/skills", label: "Skills", icon: "extension" },
];

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const [mediaOpen, setMediaOpen] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [shutdownCountdown, setShutdownCountdown] = useState(0);
  const [enableTranslator, setEnableTranslator] = useState(false);
  const { copied, copy } = useCopyToClipboard(2000);

  const INSTALL_CMD = UPDATER_CONFIG.installCmdLatest;

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => { if (data.enableTranslator) setEnableTranslator(true); })
      .catch(() => {});
  }, []);

  // Lazy check for new npm version on mount
  useEffect(() => {
    fetch("/api/version")
      .then(res => res.json())
      .then(data => { if (data.hasUpdate) setUpdateInfo(data); })
      .catch(() => {});
  }, []);

  const isActive = (href) => {
    if (href === "/dashboard/endpoint") {
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/endpoint");
    }
    return pathname.startsWith(href);
  };

  // Open manual update panel (no countdown yet — user must click Copy to trigger shutdown)
  const handleUpdate = () => {
    setShowUpdateModal(false);
    setIsUpdating(true);
  };

  // Triggered by Copy button inside ManualUpdatePanel: copy + countdown + shutdown
  const handleCopyAndShutdown = async () => {
    try { await navigator.clipboard.writeText(INSTALL_CMD); } catch { /* clipboard blocked */ }
    copy(INSTALL_CMD);
    let remaining = UPDATER_CONFIG.shutdownCountdownSec;
    setShutdownCountdown(remaining);
    const timer = setInterval(() => {
      remaining -= 1;
      setShutdownCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        fetch("/api/version/shutdown", { method: "POST" }).catch(() => {});
        setIsDisconnected(true);
      }
    }, 1000);
  };

  const handleCancelUpdate = () => {
    setIsUpdating(false);
    setShutdownCountdown(0);
  };

  // Note: legacy updater poll removed. New flow: copy install cmd + shutdown server,
  // user runs the command manually in another terminal.


  return (
    <>
      <aside className="flex w-72 flex-col border-r-[1.5px] border-black/85 dark:border-white/20 bg-surface transition-colors duration-300 min-h-full">
        {/* Traffic lights */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/60 dark:border-white/20" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/60 dark:border-white/20" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/60 dark:border-white/20" />
        </div>

        {/* Logo */}
        <div className="px-6 py-4 flex flex-col gap-2">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center size-10 rounded-2xl bg-surface border-[1.5px] border-black dark:border-white/20 p-2 shadow-[var(--shadow-hard)] group-hover:scale-105 group-hover:-rotate-3 transition-transform">
              <Image src="/icons/logo.svg" alt="ZenRouter Logo" width={28} height={28} className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tight text-text-main leading-tight">
                {APP_CONFIG.name}
              </h1>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-text-muted">v{APP_CONFIG.version}</span>
            </div>
          </Link>
          {updateInfo && (
            <div className="flex flex-col gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ↑ New version: v{updateInfo.latestVersion}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="px-2.5 py-1 rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-[11px] font-bold uppercase tracking-wider border border-black dark:border-white/30 transition-colors cursor-pointer"
                >
                  Update
                </button>
                <button
                  onClick={() => copy(INSTALL_CMD)}
                  title="Copy install command"
                  className="flex-1 text-left hover:opacity-80 transition-opacity cursor-pointer min-w-0"
                >
                  <code className="block text-[10px] text-text-main font-mono truncate">
                    {copied ? "✓ copied!" : INSTALL_CMD}
                  </code>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3.5 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-120 group font-bold text-xs uppercase tracking-wider",
                isActive(item.href)
                  ? "bg-sunburst text-slate-950 border-[1.5px] border-black shadow-[var(--shadow-hard-sm)] translate-x-1"
                  : "text-text-muted hover:bg-mist dark:hover:bg-surface-2 hover:text-text-main border-[1.5px] border-transparent"
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-[19px] transition-transform group-hover:scale-110",
                  isActive(item.href) ? "text-slate-950 fill-1" : "group-hover:text-primary"
                )}
              >
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {isActive(item.href) && (
                <span className="size-2 rounded-full bg-black animate-pulse" />
              )}
            </Link>
          ))}

          {/* System section */}
          <div className="pt-4 mt-3 space-y-1.5 border-t border-black/10 dark:border-white/10">
            <p className="px-4 text-[10px] font-mono font-black text-text-muted/80 uppercase tracking-widest mb-2">
              System
            </p>

            {/* Media Providers accordion */}
            <button
              onClick={() => setMediaOpen((v) => !v)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-120 group font-bold text-xs uppercase tracking-wider cursor-pointer",
                pathname.startsWith("/dashboard/media-providers")
                  ? "bg-sunburst text-slate-950 border-[1.5px] border-black shadow-[var(--shadow-hard-sm)] translate-x-1"
                  : "text-text-muted hover:bg-mist dark:hover:bg-surface-2 hover:text-text-main border-[1.5px] border-transparent"
              )}
            >
              <span className={cn("material-symbols-outlined text-[19px] transition-transform group-hover:scale-110", pathname.startsWith("/dashboard/media-providers") ? "text-slate-950 fill-1" : "group-hover:text-primary")}>perm_media</span>
              <span className="flex-1 text-left truncate">Media Providers</span>
              <span className="material-symbols-outlined text-[15px] transition-transform font-bold" style={{ transform: mediaOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                expand_more
              </span>
            </button>
            {mediaOpen && (
              <div className="pl-3 space-y-1">
                {MEDIA_PROVIDER_KINDS.filter((k) => VISIBLE_MEDIA_KINDS.includes(k.id)).map((kind) => (
                  <Link
                    key={kind.id}
                    href={`/dashboard/media-providers/${kind.id}`}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all text-xs font-bold uppercase tracking-wider",
                      pathname.startsWith(`/dashboard/media-providers/${kind.id}`)
                        ? "bg-mint text-slate-950 border border-black shadow-xs"
                        : "text-text-muted hover:bg-mist dark:hover:bg-surface-2 hover:text-text-main"
                    )}
                  >
                    <span className="material-symbols-outlined text-[16px]">{kind.icon}</span>
                    <span className="truncate">{kind.label}</span>
                  </Link>
                ))}
                <Link
                  key={COMBINED_WEB_ITEM.id}
                  href={COMBINED_WEB_ITEM.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all text-xs font-bold uppercase tracking-wider",
                    pathname.startsWith(COMBINED_WEB_ITEM.href)
                      ? "bg-mint text-slate-950 border border-black shadow-xs"
                      : "text-text-muted hover:bg-mist dark:hover:bg-surface-2 hover:text-text-main"
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]">{COMBINED_WEB_ITEM.icon}</span>
                  <span className="truncate">{COMBINED_WEB_ITEM.label}</span>
                </Link>
              </div>
            )}

            {systemItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-120 group font-bold text-xs uppercase tracking-wider",
                  isActive(item.href)
                    ? "bg-sunburst text-slate-950 border-[1.5px] border-black shadow-[var(--shadow-hard-sm)] translate-x-1"
                    : "text-text-muted hover:bg-mist dark:hover:bg-surface-2 hover:text-text-main border-[1.5px] border-transparent"
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-[19px] transition-transform group-hover:scale-110",
                    isActive(item.href) ? "text-slate-950 fill-1" : "group-hover:text-primary"
                  )}
                >
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {isActive(item.href) && (
                  <span className="size-2 rounded-full bg-black animate-pulse" />
                )}
              </Link>
            ))}

            {/* Debug items (inside System section, before Settings) */}
            {debugItems.map((item) => {
              const show = item.href !== "/dashboard/translator" || enableTranslator;
              return show ? (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-120 group font-bold text-xs uppercase tracking-wider",
                    isActive(item.href)
                      ? "bg-sunburst text-slate-950 border-[1.5px] border-black shadow-[var(--shadow-hard-sm)] translate-x-1"
                      : "text-text-muted hover:bg-mist dark:hover:bg-surface-2 hover:text-text-main border-[1.5px] border-transparent"
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-[19px] transition-transform group-hover:scale-110",
                      isActive(item.href) ? "text-slate-950 fill-1" : "group-hover:text-primary"
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive(item.href) && (
                    <span className="size-2 rounded-full bg-black animate-pulse" />
                  )}
                </Link>
              ) : null;
            })}

            {/* Settings */}
            <Link
              href="/dashboard/profile"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-1 rounded-lg transition-all group",
                isActive("/dashboard/profile")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-text-muted hover:bg-surface-2 hover:text-text-main"
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-[19px] transition-colors",
                  isActive("/dashboard/profile") ? "text-primary" : "group-hover:text-primary"
                )}
              >
                settings
              </span>
              <span className="text-[13px]">Settings</span>
            </Link>
          </div>
        </nav>

      </aside>

      {/* Update Confirmation Modal */}
      <ConfirmModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onConfirm={handleUpdate}
        title="Update ZenRouter"
        message={`Show install command for v${updateInfo?.latestVersion || ""}? You can copy it and shutdown to install manually.`}
        confirmText="Show Command"
        cancelText="Cancel"
        variant="primary"
      />

      {/* Disconnected / Updating Overlay */}
      {(isDisconnected || isUpdating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          {isUpdating ? (
            <ManualUpdatePanel
              latestVersion={updateInfo?.latestVersion}
              installCmd={INSTALL_CMD}
              copied={copied}
              onCopyAndShutdown={handleCopyAndShutdown}
              onCancel={handleCancelUpdate}
              countdown={shutdownCountdown}
              isDisconnected={isDisconnected}
            />
          ) : (
            <div className="text-center p-8">
              <div className="flex items-center justify-center size-16 rounded-full bg-red-500/20 text-red-500 mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">power_off</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Server Disconnected</h2>
              <p className="text-text-muted mb-6">The proxy server has been stopped.</p>
              <Button variant="secondary" onClick={() => globalThis.location.reload()}>
                Reload Page
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

Sidebar.propTypes = {
  onClose: PropTypes.func,
};

function ManualUpdatePanel({ latestVersion, installCmd, copied, onCopyAndShutdown, onCancel, countdown, isDisconnected }) {
  const isCountingDown = countdown > 0;
  return (
    <div className="w-full max-w-lg rounded-xl bg-neutral-900/95 border border-white/10 p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center size-11 rounded-full bg-amber-500/20 text-amber-400">
          <span className="material-symbols-outlined text-[24px]">content_copy</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Update ZenRouter{latestVersion ? ` to v${latestVersion}` : ""}</h2>
          <p className="text-xs text-white/60">
            {isDisconnected
              ? "Server stopped. Paste the command into a terminal to install."
              : isCountingDown
                ? `Command copied. Server will stop in ${countdown}s...`
                : "Click the button below to copy the install command and shutdown."}
          </p>
        </div>
      </div>

      <p className="text-sm text-white/80 mb-2">Install command:</p>
      <div className="w-full px-3 py-2 rounded bg-white/5 mb-4">
        <code className="text-xs font-mono text-amber-400 break-all">{installCmd}</code>
      </div>

      <ol className="text-xs text-white/70 space-y-1 list-decimal list-inside mb-4">
        <li>Click <strong>Copy & Shutdown</strong> below.</li>
        <li>Paste the command into your terminal and press Enter.</li>
        <li>Run <code className="px-1 rounded bg-white/10 text-green-400">zenrouter</code> again after install.</li>
      </ol>

      {isDisconnected ? (
        <Button variant="secondary" fullWidth onClick={() => globalThis.location.reload()}>
          Reload Page
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isCountingDown}>
            Cancel
          </Button>
          <Button variant="primary" fullWidth onClick={onCopyAndShutdown} disabled={isCountingDown}>
            {copied ? "✓ Copied — shutting down..." : isCountingDown ? `Shutting down in ${countdown}s` : "Copy & Shutdown"}
          </Button>
        </div>
      )}
    </div>
  );
}

ManualUpdatePanel.propTypes = {
  latestVersion: PropTypes.string,
  installCmd: PropTypes.string.isRequired,
  copied: PropTypes.bool,
  onCopyAndShutdown: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  countdown: PropTypes.number,
  isDisconnected: PropTypes.bool,
};
