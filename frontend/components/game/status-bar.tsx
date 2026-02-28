"use client"

import { Signal, Battery, MapPin, Wifi, Flame } from "lucide-react"
import { GlassPanel } from "./glass-panel"

interface StatusBarProps {
  playerName: string
  level: number
  xp: number
  maxXp: number
  isOnline: boolean
  streak?: number
}

export function StatusBar({ 
  playerName, 
  level, 
  xp, 
  maxXp,
  isOnline,
  streak = 0
}: StatusBarProps) {
  const xpPercentage = (xp / maxXp) * 100

  return (
    <GlassPanel className="px-3 py-2">
      <div className="flex items-center justify-between">
        {/* Left: Player Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
              <span className="text-xs font-mono text-primary font-bold">
                {level}
              </span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border border-background" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-mono text-foreground/90 uppercase tracking-wider">
              {playerName}
            </span>
            {/* XP Bar */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {xp}/{maxXp}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Status Icons */}
        <div className="flex items-center gap-2">
          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent/20 border border-accent/30">
              <Flame className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] font-mono font-bold text-accent">{streak}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono text-primary uppercase">GPS</span>
          </div>
          <div className={`flex items-center gap-1 ${isOnline ? 'text-primary' : 'text-destructive'}`}>
            {isOnline ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <Signal className="w-3 h-3" />
            )}
          </div>
          <div className="flex items-center gap-0.5 text-foreground/60">
            <Battery className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono">87</span>
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}
