"use client"

import { Navigation, Maximize2 } from "lucide-react"
import { GlassPanel } from "./glass-panel"

interface MiniMapProps {
  heading: number
  onExpand?: () => void
}

export function MiniMap({ heading, onExpand }: MiniMapProps) {
  return (
    <GlassPanel className="w-20 h-20 relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 cyber-grid opacity-50" />
      
      {/* Compass rose */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="relative w-12 h-12"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          {/* Cardinal directions */}
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-[8px] font-mono text-primary font-bold">
            N
          </span>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-[8px] font-mono text-muted-foreground">
            S
          </span>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 text-[8px] font-mono text-muted-foreground">
            W
          </span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 text-[8px] font-mono text-muted-foreground">
            E
          </span>
          
          {/* Compass needle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-0.5 h-6 bg-gradient-to-b from-primary via-primary to-transparent rounded-full" />
          </div>
        </div>
      </div>

      {/* Player indicator (always centered, doesn't rotate) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-3 h-3 rounded-full bg-neon-green border-2 border-background shadow-lg" />
      </div>

      {/* Heading display */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
        <span className="text-[9px] font-mono text-foreground/70">
          {Math.round(heading)}°
        </span>
      </div>

      {/* Expand button */}
      <button 
        onClick={onExpand}
        className="absolute top-1 right-1 p-0.5 rounded hover:bg-muted/50 transition-colors"
      >
        <Maximize2 className="w-3 h-3 text-muted-foreground" />
      </button>

      {/* Scanning line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-x-0 h-px bg-primary/30"
          style={{ 
            animation: 'scan 3s linear infinite',
            top: '50%'
          }} 
        />
      </div>
    </GlassPanel>
  )
}
