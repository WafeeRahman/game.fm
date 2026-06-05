"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const STATUSES = [
  { value: "PLAYING",   label: "Playing",   color: "text-blue-400" },
  { value: "COMPLETED", label: "Completed", color: "text-green-400" },
  { value: "DROPPED",   label: "Dropped",   color: "text-red-400" },
  { value: "BACKLOG",   label: "Backlog",   color: "text-white/60" },
  { value: "WISHLIST",  label: "Wishlist",  color: "text-yellow-400" },
  { value: "SHELVED",   label: "Shelved",   color: "text-white/40" },
];

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="text-xl leading-none focus:outline-none transition-transform hover:scale-110"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(value === star ? 0 : star)}
        >
          <span className={display >= star ? "text-yellow-400" : "text-white/15"}>★</span>
        </button>
      ))}
      {value > 0 && (
        <span className="text-xs text-white/30 ml-1.5">{value}/5</span>
      )}
    </div>
  );
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

export default function LogGameButton({ igdbId, existingLog }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(existingLog?.status ?? "PLAYING");
  const [rating, setRating] = useState(existingLog?.rating ?? 0);
  const [review, setReview] = useState(existingLog?.review ?? "");
  const [isReplay, setIsReplay] = useState(existingLog?.isReplay ?? false);
  const [playedOn, setPlayedOn] = useState(
    existingLog?.playedOn
      ? new Date(existingLog.playedOn).toISOString().split("T")[0]
      : todayString()
  );
  const [isSpoiler, setIsSpoiler] = useState(existingLog?.isSpoiler ?? false);
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
        isSpoiler,
        playedOn,
      }),
    });

    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  const statusInfo = STATUSES.find((s) => s.value === (existingLog?.status ?? "PLAYING"));

  const buttonLabel = existingLog
    ? `${existingLog.status.charAt(0) + existingLog.status.slice(1).toLowerCase()} ✓`
    : "Log this game";

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
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="relative bg-neutral-900 border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-white">
                {existingLog ? "Update log" : "Log this game"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Status */}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                  Status
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStatus(s.value)}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                        status === s.value
                          ? "bg-violet-600 border-violet-500 text-white"
                          : "bg-white/5 border-white/10 text-white/50 hover:border-white/25"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date played */}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                  Date played
                </label>
                <input
                  type="date"
                  value={playedOn}
                  onChange={(e) => setPlayedOn(e.target.value)}
                  max={todayString()}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/60 transition-colors [color-scheme:dark]"
                />
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
                <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">
                  Review{" "}
                  <span className="normal-case text-white/20">(optional)</span>
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="What did you think?"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/60 resize-none transition-colors"
                />
              </div>

              {/* Replay & Spoiler */}
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isReplay}
                    onChange={(e) => setIsReplay(e.target.checked)}
                    className="accent-violet-500 w-4 h-4"
                  />
                  <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
                    This is a replay
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isSpoiler}
                    onChange={(e) => setIsSpoiler(e.target.checked)}
                    className="accent-amber-500 w-4 h-4"
                  />
                  <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
                    Review contains spoilers
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {saving ? "Saving..." : existingLog ? "Update log" : "Save to diary"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
