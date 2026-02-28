"use client"

import { useState, useEffect } from "react"
import { MapProvider } from "@/contexts/map-context"
import { NYC_FALLBACK } from "@/lib/geo"
import { GoogleMapLayer } from "@/components/game/google-map-layer"
import { GameOverlay } from "@/components/game/game-overlay"

export default function GamePage() {
  const [playerPos, setPlayerPos] = useState<{ lat: number; lng: number }>(NYC_FALLBACK)
  const [useNYCMock, setUseNYCMock] = useState(false)

  useEffect(() => {
    if (useNYCMock) {
      setPlayerPos(NYC_FALLBACK)
      return
    }
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPlayerPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setPlayerPos(NYC_FALLBACK)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [useNYCMock])

  return (
    <main className="relative min-h-screen min-h-[100dvh] bg-background overflow-hidden touch-manipulation">
      <MapProvider playerPos={playerPos}>
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

        {/* Dev: Use NYC mock location */}
        <label className="absolute top-2 right-2 z-50 flex items-center gap-2 px-2 py-1 rounded bg-background/80 border border-border text-[10px] font-mono">
          <input
            type="checkbox"
            checked={useNYCMock}
            onChange={(e) => setUseNYCMock(e.target.checked)}
            className="rounded"
          />
          Use NYC mock
        </label>
      </MapProvider>
    </main>
  )
}
