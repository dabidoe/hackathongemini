"use client"

import { MapProvider } from "@/contexts/map-context"
import { NYC_FALLBACK } from "@/lib/geo"
import { GoogleMapLayer } from "@/components/game/google-map-layer"
import { GameOverlay } from "@/components/game/game-overlay"

export default function GamePage() {
  return (
    <main className="relative min-h-screen min-h-[100dvh] bg-background overflow-hidden touch-manipulation">
      <MapProvider playerPos={NYC_FALLBACK}>
        {/* Google Maps background layer */}
        <div className="absolute inset-0 z-0">
          <GoogleMapLayer />
        </div>

        {/* Map darkening overlay — night vibe */}
        <div
          className="absolute inset-0 z-[5] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 20%, rgba(0,0,0,0.6) 40%)",
          }}
        />

        {/* Game UI Overlay */}
        <GameOverlay />
      </MapProvider>
    </main>
  )
}
