"use client";

import { useMemo } from "react";
import type { MapTheme } from "@/lib/mapStyles";
import { haversineMeters } from "@/lib/geo";
import type { PlaceResult } from "@/app/api/places/route";

interface HUDProps {
  theme: MapTheme;
  playerPos: { lat: number; lng: number };
  hotspots: PlaceResult[];
  nearestHotspot: PlaceResult | null;
}

/**
 * Mini HUD: nearest 5 hotspots list + Start encounter button.
 * Encounter button enabled only when within 75m of a hotspot.
 */
export default function HUD({
  theme,
  playerPos,
  hotspots,
  nearestHotspot,
}: HUDProps) {
  const nearest5 = useMemo(() => {
    return [...hotspots]
      .map((h) => ({
        ...h,
        distance: haversineMeters(playerPos.lat, playerPos.lng, h.lat, h.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [hotspots, playerPos]);

  const handleStartEncounter = () => {
    if (nearestHotspot) {
      // Placeholder for MVP
      alert(`Encounter started at: ${nearestHotspot.name}`);
    }
  };

  const isFantasy = theme === "fantasy";

  return (
    <div
      className={`absolute bottom-6 left-6 right-6 max-w-sm rounded-lg border-2 p-4 shadow-xl sm:right-auto ${
        isFantasy
          ? "border-amber-700/50 bg-amber-950/80"
          : "border-cyan-700/50 bg-slate-900/90"
      }`}
    >
      <h2
        className={`mb-3 text-sm font-semibold uppercase tracking-wider ${
          isFantasy ? "text-amber-300" : "text-cyan-400"
        }`}
      >
        Nearby Hotspots
      </h2>

      <ul className="mb-4 space-y-1.5 text-sm">
        {nearest5.map((h) => (
          <li
            key={h.place_id}
            className={`flex justify-between ${
              h.place_id === nearestHotspot?.place_id
                ? isFantasy
                  ? "text-amber-200 font-medium"
                  : "text-cyan-300 font-medium"
                : "text-slate-300"
            }`}
          >
            <span className="truncate pr-2">{h.name}</span>
            <span className="shrink-0 tabular-nums">
              {Math.round(h.distance)}m
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleStartEncounter}
        disabled={!nearestHotspot}
        className={`w-full rounded py-2 font-semibold transition ${
          nearestHotspot
            ? isFantasy
              ? "bg-amber-600 text-amber-50 hover:bg-amber-500"
              : "bg-cyan-600 text-white hover:bg-cyan-500"
            : "cursor-not-allowed bg-slate-600 text-slate-400"
        }`}
      >
        {nearestHotspot
          ? `Start encounter at ${nearestHotspot.name}`
          : "Move within 75m of a hotspot"}
      </button>
    </div>
  );
}
