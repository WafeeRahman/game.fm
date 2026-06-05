import { describe, it, expect } from "vitest";
import { igdbImageUrl } from "@/lib/igdb";

describe("IGDB utilities", () => {
  describe("igdbImageUrl", () => {
    it("generates correct CDN URL with default size", () => {
      const url = igdbImageUrl("abc123");
      expect(url).toBe("https://images.igdb.com/igdb/image/upload/t_cover_big/abc123.jpg");
    });

    it("generates correct CDN URL with custom size", () => {
      const url = igdbImageUrl("abc123", "screenshot_big");
      expect(url).toBe("https://images.igdb.com/igdb/image/upload/t_screenshot_big/abc123.jpg");
    });

    it("returns null for missing image_id", () => {
      expect(igdbImageUrl(null)).toBeNull();
      expect(igdbImageUrl(undefined)).toBeNull();
    });
  });
});
