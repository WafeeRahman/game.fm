"use client";

import { useState } from "react";

export default function SpoilerText({ children, label = "Spoiler — click to reveal" }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return <>{children}</>;
  }

  return (
    <button
      onClick={() => setRevealed(true)}
      className="relative inline-block cursor-pointer group"
    >
      <span className="blur-sm select-none pointer-events-none" aria-hidden="true">
        {children}
      </span>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] text-white/40 bg-white/5 border border-white/10 rounded px-2 py-0.5 group-hover:border-white/25 group-hover:text-white/60 transition-colors">
          {label}
        </span>
      </span>
    </button>
  );
}
