"use client"

import { useEffect, useState, useCallback } from "react"
import { MapPin, Flame, Target, LogIn, LogOut } from "lucide-react"
import { GlassPanel } from "./glass-panel"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

interface StatusBarProps {
  playerName: string
  level: number
  xp: number
  maxXp: number
  streak?: number
  questsCompleted?: number
  onProfileClick?: () => void
}

function xpToLevel(xp: number): { level: number; maxXp: number } {
  const level = Math.floor(xp / 500) + 1
  const maxXp = level * 500
  return { level, maxXp }
}

export function StatusBar({ 
  playerName, 
  level, 
  xp, 
  maxXp,
  streak = 0,
  questsCompleted = 0,
  onProfileClick,
}: StatusBarProps) {
  const { user, loading, signInWithGoogle, signOut, getIdToken } = useAuth()
  const [userXp, setUserXp] = useState<number | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const fetchUserXp = useCallback(async () => {
    if (!user) {
      setUserXp(null)
      return
    }
    const token = await getIdToken()
    if (!token) return
    try {
      const res = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUserXp(data.xp ?? 0)
      }
    } catch {
      setUserXp(null)
    }
  }, [user, getIdToken])

  useEffect(() => {
    fetchUserXp()
  }, [fetchUserXp])

  useEffect(() => {
    const handler = () => fetchUserXp()
    window.addEventListener("user:quest-completed", handler)
    return () => window.removeEventListener("user:quest-completed", handler)
  }, [fetchUserXp])

  const displayXp = user && userXp !== null ? userXp : xp
  const displayLevel = user && userXp !== null ? xpToLevel(userXp).level : level
  const displayMaxXp = user && userXp !== null ? xpToLevel(userXp).maxXp : maxXp
  const xpPercentage = (displayXp / displayMaxXp) * 100

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signInWithGoogle()
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <GlassPanel variant="strong" className="px-3 py-2">
      <div className="flex items-center justify-between">
        {/* Left: Player Info - click to open profile */}
        <div
          className={`flex items-center gap-3 ${onProfileClick ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
          onClick={onProfileClick}
          role={onProfileClick ? "button" : undefined}
          aria-label={onProfileClick ? "Open profile" : undefined}
        >
          <div className="relative">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-8 h-8 rounded-full border border-primary object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
                <span className="text-xs font-mono text-primary font-bold">
                  {displayLevel}
                </span>
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border border-background" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-mono text-foreground/90 uppercase tracking-wider">
              {user?.displayName ?? playerName}
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
                {displayXp}/{displayMaxXp}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Auth + Status Icons */}
        <div className="flex items-center gap-2">
          {!loading && (
            user ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] font-mono gap-1"
                onClick={signOut}
              >
                <LogOut className="w-3 h-3" />
                Sign out
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] font-mono gap-1"
                onClick={handleSignIn}
                disabled={isSigningIn}
              >
                <LogIn className="w-3 h-3" />
                Sign in
              </Button>
            )
          )}
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
          <div className="flex items-center gap-1 text-foreground/80">
            <Target className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono">{questsCompleted}</span>
            <span className="text-[9px] font-mono text-muted-foreground uppercase hidden sm:inline">Missions</span>
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}
