"use client"

import { GameOverlay } from "@/components/game/game-overlay"

export default function GamePage() {
  return (
    <main className="relative min-h-screen min-h-[100dvh] bg-background overflow-hidden touch-manipulation">
      {/* 
        MAP LAYER PLACEHOLDER
        This is where your teammate's Leaflet map would be rendered.
        The map should be rendered as a full-screen layer behind the GameOverlay.
        
        Example integration:
        <LeafletMap className="absolute inset-0 z-0" />
      */}
      <div className="absolute inset-0 z-0">
        {/* Cyberpunk grid background as placeholder */}
        <div className="absolute inset-0 cyber-grid opacity-60" />
        
        {/* Atmospheric gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
        
        {/* Simulated map streets/blocks pattern */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(90deg, oklch(0.35 0.06 45 / 0.25) 1px, transparent 1px),
              linear-gradient(oklch(0.35 0.06 45 / 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }} />
          {/* Diagonal streets */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(45deg, oklch(0.4 0.05 45 / 0.12) 1px, transparent 1px)
            `,
            backgroundSize: '120px 120px'
          }} />
        </div>

        {/* Animated compass sweep effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[500px] h-[500px] opacity-15">
            <div 
              className="absolute inset-0 rounded-full border border-primary/25"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, oklch(0.72 0.18 45 / 0.25) 20deg, transparent 50deg)'
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{ animation: 'spin 12s linear infinite' }}
              />
            </div>
            {/* Concentric rings */}
            <div className="absolute inset-[20%] rounded-full border border-primary/15" />
            <div className="absolute inset-[40%] rounded-full border border-primary/10" />
          </div>
        </div>

        {/* Center indicator */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full border border-primary/15 flex items-center justify-center backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full border border-primary/25 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border border-primary/40 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary/80 animate-pulse" />
                </div>
              </div>
            </div>
            <p className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.15em]">
              Chronicle Map
            </p>
            <p className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">
              Awaiting Leaflet Layer
            </p>
          </div>
        </div>

        {/* Subtle ambient glow */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/3 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full bg-accent/3 blur-3xl" />

        {/* Subtle scan lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.015]">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 3px,
              oklch(0.5 0.1 45 / 0.15) 3px,
              oklch(0.5 0.1 45 / 0.15) 4px
            )`
          }} />
        </div>
      </div>

      {/* Game UI Overlay */}
      <GameOverlay />
    </main>
  )
}
