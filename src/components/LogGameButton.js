"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const STATUSES = [
  { value: "PLAYING", label: "Playing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
  { value: "BACKLOG", label: "Backlog" },
  { value: "WISHLIST", label: "Wishlist" },
  { value: "SHELVED", label: "Shelved" },
];

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="relative text-2xl leading-none focus:outline-none"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(value === star ? 0 : star)}
        >
          <span className={display >= star ? "text-yellow-400" : "text-white/20"}>★</span>
        </button>
      ))}
      {value > 0 && (
        <span className="text-xs text-white/40 ml-1">{value}/5</span>
      )}
    </div>
  );
}

export default function LogGameButton({ igdbId, existingLog }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(existingLog?.status ?? "PLAYING");
  const [rating, setRating] = useState(existingLog?.rating ?? 0);
  const [review, setReview] = useState(existingLog?.review ?? "");
  const [isReplay, setIsReplay] = useState(existingLog?.isReplay ?? false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        igdbId,
        status,
        rating: rating || null,
        review,
        isReplay,
      }),
    });

    setSaving(false);
    setOpen(false);
    router.refresh(); // re-run server components to reflect the new log
  }

  const buttonLabel = existingLog ? `${existingLog.status.charAt(0) + existingLog.status.slice(1).toLowerCase()} ✓` : "Log this game";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`text-sm px-4 py-2 rounded-lg transition-colors ${
          existingLog
            ? "bg-violet-600/30 text-violet-300 border border-violet-500/40 hover:bg-violet-600/50"
            : "bg-violet-600 hover:bg-violet-500 text-white"
        }`}
      >
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-neutral-900 border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Log game</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Status */}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStatus(s.value)}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                        status === s.value
                          ? "bg-violet-600 border-violet-500 text-white"
                          : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                  Rating
                </label>
                <StarRating value={rating} onChange={setRating} />
              </div>

              {/* Review */}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                  Review <span className="normal-case">(optional)</span>
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="What did you think?"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500 resize-none transition-colors"
                />
              </div>

              {/* Replay */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isReplay}
                  onChange={(e) => setIsReplay(e.target.checked)}
                  className="accent-violet-500 w-4 h-4"
                />
                <span className="text-sm text-white/60">This is a replay</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {saving ? "Saving..." : existingLog ? "Update log" : "Save log"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
