import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  COUNTDOWN_INTERVAL_MS,
  createQuotaAutoRefresh,
} from "@/app/(dashboard)/dashboard/usage/components/ProviderLimits/utils.js";

function fakeDocument() {
  const listeners = new Set();
  return {
    hidden: false,
    addEventListener(type, listener) { if (type === "visibilitychange") listeners.add(listener); },
    removeEventListener(type, listener) { if (type === "visibilitychange") listeners.delete(listener); },
    setHidden(hidden) {
      this.hidden = hidden;
      for (const listener of listeners) listener();
    },
    dispatchVisibilityChange() {
      for (const listener of listeners) listener();
    },
  };
}

describe("quota auto-refresh timers (#3470)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("does not stack countdown timers across visibility changes", () => {
    const doc = fakeDocument();
    let ticks = 0;
    const timers = createQuotaAutoRefresh({ onTick: () => ticks++, doc });
    timers.start();

    doc.dispatchVisibilityChange();
    doc.dispatchVisibilityChange();
    vi.advanceTimersByTime(10 * COUNTDOWN_INTERVAL_MS);
    expect(ticks).toBe(10);

    doc.setHidden(true);
    vi.advanceTimersByTime(10 * COUNTDOWN_INTERVAL_MS);
    expect(ticks).toBe(10);

    doc.setHidden(false);
    vi.advanceTimersByTime(5 * COUNTDOWN_INTERVAL_MS);
    expect(ticks).toBe(15);
    timers.stop();
  });
});