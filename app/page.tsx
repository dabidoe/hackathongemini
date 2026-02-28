"use client";

import { useState } from "react";
import ThemeModal from "@/components/ThemeModal";
import MapView from "@/components/MapView";
import type { MapTheme } from "@/lib/mapStyles";

/**
 * Main page: ThemeModal first, then MapView + HUD.
 * Map starts in NYC (geolocation removed for now).
 */
export default function Home() {
  const [theme, setTheme] = useState<MapTheme | null>(null);
  const [themeSelected, setThemeSelected] = useState(false);

  const handleThemeSelect = (t: MapTheme) => {
    setTheme(t);
    setThemeSelected(true);
  };

  return (
    <main className="relative h-screen w-full">
      {/* Theme picker modal — shown before map loads */}
      {!themeSelected && <ThemeModal onSelect={handleThemeSelect} />}

      {/* Map + HUD — shown after theme selected */}
      {themeSelected && theme && <MapView theme={theme} />}
    </main>
  );
}
