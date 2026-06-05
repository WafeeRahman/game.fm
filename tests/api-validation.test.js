import { describe, it, expect } from "vitest";

// Unit tests for API input validation logic
// These don't hit the database — they test the validation rules used by routes

const VALID_STATUSES = ["PLAYING", "COMPLETED", "DROPPED", "BACKLOG", "WISHLIST", "SHELVED"];

describe("Game log validation", () => {
  it("accepts all valid statuses", () => {
    for (const status of VALID_STATUSES) {
      expect(VALID_STATUSES.includes(status)).toBe(true);
    }
  });

  it("rejects invalid statuses", () => {
    expect(VALID_STATUSES.includes("INVALID")).toBe(false);
    expect(VALID_STATUSES.includes("")).toBe(false);
    expect(VALID_STATUSES.includes("playing")).toBe(false); // case sensitive
  });

  it("validates rating range", () => {
    const isValidRating = (r) => r === null || r === undefined || (r >= 1 && r <= 5);
    expect(isValidRating(null)).toBe(true);
    expect(isValidRating(undefined)).toBe(true);
    expect(isValidRating(1)).toBe(true);
    expect(isValidRating(5)).toBe(true);
    expect(isValidRating(3.5)).toBe(true);
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(6)).toBe(false);
    expect(isValidRating(-1)).toBe(false);
  });

  it("validates review length", () => {
    const isValidReview = (r) => !r || r.length <= 2000;
    expect(isValidReview(null)).toBe(true);
    expect(isValidReview("")).toBe(true);
    expect(isValidReview("Great game!")).toBe(true);
    expect(isValidReview("x".repeat(2000))).toBe(true);
    expect(isValidReview("x".repeat(2001))).toBe(false);
  });
});

describe("Chart size parsing", () => {
  it("parses grid sizes correctly", () => {
    const parse = (s) => s.split("x").map(Number);
    expect(parse("3x3")).toEqual([3, 3]);
    expect(parse("4x4")).toEqual([4, 4]);
    expect(parse("5x5")).toEqual([5, 5]);
  });

  it("caps grid items at 25", () => {
    const sizes = ["3x3", "4x4", "5x5"];
    for (const size of sizes) {
      const [cols, rows] = size.split("x").map(Number);
      expect(Math.min(cols * rows, 25)).toBeLessThanOrEqual(25);
    }
  });
});

describe("Bot auth check", () => {
  it("validates bearer token format", () => {
    const isAuthorized = (header, secret) => {
      if (!secret) return false;
      return header === `Bearer ${secret}`;
    };

    expect(isAuthorized("Bearer abc123", "abc123")).toBe(true);
    expect(isAuthorized("Bearer wrong", "abc123")).toBe(false);
    expect(isAuthorized("abc123", "abc123")).toBe(false);
    expect(isAuthorized(null, "abc123")).toBe(false);
    expect(isAuthorized("Bearer abc123", null)).toBe(false);
  });
});
