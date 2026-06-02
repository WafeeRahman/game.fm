"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const PLATFORMS = ["PC", "PlayStation 5", "PlayStation 4", "Xbox Series X/S", "Nintendo Switch", "Mobile", "Other"];

export default function LogSessionButton({ igdbId }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [platform, setPlatform] = useState("");
  const [saving, setSaving] = useState(false);

  function close() {
    setOpen(false);
    setHours("");
    setMinutes("");
    setPlatform("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const totalMins = (parseInt(hours || 0) * 60) + parseInt(minutes || 0) || null;

    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ igdbId, durationMins: totalMins, platform: platform || null }),
    });

    setSaving(false);
    close();
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm px-4 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
      >
        + Session
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />

          <div className="relative bg-neutral-900 border border-white/10 rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-white">Log a session</h2>
                <p className="text-xs text-white/30 mt-0.5">Retroactive — for sessions Discord didn&apos;t catch</p>
              </div>
              <button onClick={close} className="text-white/40 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Duration */}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                  Duration
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="99"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:border-violet-500/60 transition-colors"
                    />
                    <span className="block text-center text-xs text-white/30 mt-1">hours</span>
                  </div>
                  <span className="text-white/20 pb-5">:</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="59"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:border-violet-500/60 transition-colors"
                    />
                    <span className="block text-center text-xs text-white/30 mt-1">minutes</span>
                  </div>
                </div>
              </div>

              {/* Platform */}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                  Platform <span className="normal-case text-white/20">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(platform === p ? "" : p)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        platform === p
                          ? "bg-violet-600 border-violet-500 text-white"
                          : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || (!hours && !minutes)}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {saving ? "Saving..." : "Save session"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
