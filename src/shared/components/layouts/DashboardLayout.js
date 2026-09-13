"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useNotificationStore } from "@/store/notificationStore";
import Sidebar from "../Sidebar";
import Header from "../Header";
import PasswordOnboardingModal from "../PasswordOnboardingModal";

function getToastStyle(type) {
  if (type === "success") {
    return {
      wrapper: "border-[1.5px] border-black dark:border-white/30 bg-mint text-slate-950 shadow-[var(--shadow-hard)] font-bold",
      icon: "check_circle",
    };
  }
  if (type === "error") {
    return {
      wrapper: "border-[1.5px] border-black dark:border-white/30 bg-ember text-white shadow-[var(--shadow-hard)] font-bold",
      icon: "error",
    };
  }
  if (type === "warning") {
    return {
      wrapper: "border-[1.5px] border-black dark:border-white/30 bg-sunburst text-slate-950 shadow-[var(--shadow-hard)] font-bold",
      icon: "warning",
    };
  }
  return {
    wrapper: "border-[1.5px] border-black dark:border-white/30 bg-electric text-white shadow-[var(--shadow-hard)] font-bold",
    icon: "info",
  };
}

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg">
      <div className="fixed top-4 right-4 z-[80] flex w-[min(92vw,380px)] flex-col gap-2.5">
        {notifications.map((n) => {
          const style = getToastStyle(n.type);
          return (
            <div
              key={n.id}
              className={`rounded-2xl px-4 py-3 ${style.wrapper} animate-in fade-in slide-in-from-top-3 duration-150`}
            >
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[20px] leading-5 shrink-0">{style.icon}</span>
                <div className="min-w-0 flex-1">
                  {n.title ? <p className="text-xs font-black uppercase tracking-wider mb-0.5">{n.title}</p> : null}
                  <p className="text-xs font-semibold whitespace-pre-wrap break-words opacity-95">{n.message}</p>
                </div>
                {n.dismissible ? (
                  <button
                    type="button"
                    onClick={() => removeNotification(n.id)}
                    className="shrink-0 size-6 rounded-full border border-current/40 hover:bg-black/10 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Dismiss notification"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:hidden transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex flex-col flex-1 h-full min-w-0 relative transition-colors duration-300 isolate">
        {/* Faint grid background */}
        <div className="landing-grid absolute inset-0 pointer-events-none -z-10" aria-hidden="true" />
        <Header key={pathname} onMenuClick={() => setSidebarOpen(true)} />
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${pathname === "/dashboard/basic-chat" ? "" : "p-6 lg:p-10"} ${pathname === "/dashboard/basic-chat" ? "flex flex-col overflow-hidden" : ""}`}>
          <div className={`${pathname === "/dashboard/basic-chat" ? "flex-1 w-full h-full flex flex-col" : "max-w-7xl mx-auto"}`}>{children}</div>
        </div>
      </main>

      {/* Onboarding Password Prompt */}
      <PasswordOnboardingModal />
    </div>
  );
}
