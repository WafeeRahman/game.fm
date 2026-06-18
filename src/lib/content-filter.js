const BLOCKED_WORDS = [
  "nigger", "nigga", "faggot", "fag", "retard", "retarded",
  "tranny", "kike", "spic", "wetback", "chink", "gook",
  "coon", "darkie", "beaner", "raghead", "towelhead",
  "dyke",
];

const BLOCKED_PATTERNS = BLOCKED_WORDS.map(
  (w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "i"),
);

export function checkReview(text) {
  if (!text) return { ok: true };

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        ok: false,
        reason: "Your review contains language that violates our community guidelines.",
      };
    }
  }

  return { ok: true };
}
