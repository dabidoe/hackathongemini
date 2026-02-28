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
  profileImageUrl?: string | null
  /** Called when sign-in fails (e.g. Firebase not configured, popup blocked). */
  onSignInError?: (message: string) => void
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
  profileImageUrl = null,
  onSignInError,
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed"
      onSignInError?.(message)
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <GlassPanel variant="strong" className="px-4 py-2.5">
      <div className="flex items-center justify-between">
        {/* Left: Player Info - click to open profile */}
        <div
          className={`flex items-center gap-3.5 ${onProfileClick ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
          onClick={onProfileClick}
          role={onProfileClick ? "button" : undefined}
          aria-label={onProfileClick ? "Open profile" : undefined}
        >
          <div className="relative flex-shrink-0">
            {profileImageUrl ? (
              <>
                <div className="w-10 h-10 rounded-full overflow-hidden border border-primary bg-primary/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border border-background" title={`Level ${displayLevel}`} />
              </>
            ) : user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-10 h-10 rounded-full border border-primary object-cover"
              />
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
                  <span className="text-sm font-mono text-primary font-bold">{displayLevel}</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border border-background" />
              </>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-mono text-foreground/90 uppercase tracking-wider">
              {user?.displayName ?? playerName}
            </span>
            {/* XP Bar */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {displayXp}/{displayMaxXp}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Auth + Status Icons */}
        <div className="flex items-center gap-2.5">
          {!loading && (
            user ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs font-mono gap-1.5"
                onClick={signOut}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs font-mono gap-1.5"
                onClick={handleSignIn}
                disabled={isSigningIn}
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </Button>
            )
          )}
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-accent/20 border border-accent/30">
              <Flame className="w-4 h-4 text-accent" />
              <span className="text-xs font-mono font-bold text-accent">{streak}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-primary uppercase">GPS</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground/80">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono">{questsCompleted}</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase hidden sm:inline">Missions</span>
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}
