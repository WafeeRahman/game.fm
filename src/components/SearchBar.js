"use client";

import { useRef, useEffect } from "react";
import { Search } from "lucide-react";

export default function SearchBar({ defaultValue = "", autoFocus = false }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  return (
    <form action="/games" method="GET" className="relative w-full max-w-xl">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
      <input
        ref={inputRef}
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search for a game..."
        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all"
      />
    </form>
  );
}
