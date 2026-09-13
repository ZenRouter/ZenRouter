"use client";

import { useState, useEffect } from "react";
import { LOCALE_COOKIE, normalizeLocale } from "@/i18n/config";
import { LOCALE_FLAGS } from "@/shared/constants/locales";
import LanguageSwitcher from "./LanguageSwitcher";

function getLocaleFromCookie() {
  if (typeof document === "undefined") return "en";
  const cookie = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith(`${LOCALE_COOKIE}=`));
  const value = cookie ? decodeURIComponent(cookie.split("=")[1]) : "en";
  return normalizeLocale(value);
}

export default function HeaderLanguage() {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = getLocaleFromCookie();
      if (!cancelled) setLocale(next);
    })();
    return () => { cancelled = true; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center size-8 sm:size-9 rounded-full border-[1.5px] border-black/85 dark:border-white/25 bg-surface text-text-main shadow-[var(--shadow-hard-sm)] hover:shadow-[var(--shadow-hard)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        title="Language"
        data-i18n-skip="true"
      >
        <span className="text-base leading-none">{LOCALE_FLAGS[locale] || "🌐"}</span>
      </button>

      <LanguageSwitcher
        hideTrigger
        isOpen={open}
        onClose={(next) => {
          setOpen(false);
          setLocale(next);
        }}
      />
    </>
  );
}
