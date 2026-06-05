import { describe, it, expect } from "vitest";

// Test the helper functions used by the Discord bot commands

function formatDur(mins) {
  if (!mins) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

describe("formatDur", () => {
  it("handles zero/null/undefined", () => {
    expect(formatDur(0)).toBe("0m");
    expect(formatDur(null)).toBe("0m");
    expect(formatDur(undefined)).toBe("0m");
  });

  it("formats minutes only", () => {
    expect(formatDur(30)).toBe("30m");
    expect(formatDur(1)).toBe("1m");
    expect(formatDur(59)).toBe("59m");
  });

  it("formats hours only", () => {
    expect(formatDur(60)).toBe("1h");
    expect(formatDur(120)).toBe("2h");
    expect(formatDur(300)).toBe("5h");
  });

  it("formats hours and minutes", () => {
    expect(formatDur(90)).toBe("1h 30m");
    expect(formatDur(150)).toBe("2h 30m");
    expect(formatDur(61)).toBe("1h 1m");
  });
});

describe("timeAgo", () => {
  it("shows 'just now' for recent timestamps", () => {
    expect(timeAgo(new Date().toISOString())).toBe("just now");
  });

  it("shows minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("shows hours ago", () => {
    const threeHrsAgo = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(timeAgo(threeHrsAgo)).toBe("3h ago");
  });

  it("shows days ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe("2d ago");
  });
});

describe("period filtering", () => {
  function periodStart(period) {
    const now = new Date();
    switch (period) {
      case "week":  return new Date(now - 7 * 86400000);
      case "month": return new Date(now - 30 * 86400000);
      case "year":  return new Date(now - 365 * 86400000);
      default:      return null;
    }
  }

  it("returns null for alltime", () => {
    expect(periodStart("alltime")).toBeNull();
  });

  it("returns a date in the past for valid periods", () => {
    const now = Date.now();
    expect(periodStart("week").getTime()).toBeLessThan(now);
    expect(periodStart("month").getTime()).toBeLessThan(now);
    expect(periodStart("year").getTime()).toBeLessThan(now);
  });

  it("week is ~7 days ago", () => {
    const weekStart = periodStart("week");
    const daysAgo = (Date.now() - weekStart.getTime()) / 86400000;
    expect(daysAgo).toBeCloseTo(7, 0);
  });
});
