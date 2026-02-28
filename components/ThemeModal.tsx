"use client";

import type { MapTheme } from "@/lib/mapStyles";

interface ThemeModalProps {
  onSelect: (theme: MapTheme) => void;
}

/**
 * Full-screen theme picker shown before map loads.
 * Fantasy: warm, organic; Cyberpunk: neon, tech.
 */
export default function ThemeModal({ onSelect }: ThemeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95">
      <div className="mx-4 max-w-2xl text-center">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Choose Your World
        </h1>
        <p className="mb-8 text-slate-400">
          Select a theme to begin your adventure
        </p>

        <div className="flex flex-col gap-6 sm:flex-row sm:justify-center">
          {/* Fantasy */}
          <button
            onClick={() => onSelect("fantasy")}
            className="group flex flex-col items-center gap-4 rounded-xl border-2 border-amber-700/50 bg-amber-950/40 p-8 transition-all hover:border-amber-500 hover:bg-amber-900/50 hover:shadow-lg hover:shadow-amber-500/20"
          >
            <span className="text-5xl" aria-hidden>
              🏰
            </span>
            <span className="text-xl font-semibold text-amber-200">Fantasy</span>
            <span className="text-sm text-amber-300/80">
              Warm earth tones, ancient lands
            </span>
          </button>

          {/* Cyberpunk */}
          <button
            onClick={() => onSelect("cyberpunk")}
            className="group flex flex-col items-center gap-4 rounded-xl border-2 border-cyan-700/50 bg-slate-900/60 p-8 transition-all hover:border-cyan-400 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-cyan-500/20"
          >
            <span className="text-5xl" aria-hidden>
              🌃
            </span>
            <span className="text-xl font-semibold text-cyan-300">Cyberpunk</span>
            <span className="text-sm text-cyan-400/80">
              Neon lights, dark streets
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
