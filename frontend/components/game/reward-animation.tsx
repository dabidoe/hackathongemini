"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Star, Zap, TrendingUp } from "lucide-react"
import { GlassPanel } from "./glass-panel"

interface RewardAnimationProps {
  isVisible: boolean
  onComplete: () => void
  reward: {
    xp: number
    blockProgress?: number
    message?: string
    type?: "success" | "achievement" | "level_up"
  }
}

export function RewardAnimation({ 
  isVisible, 
  onComplete, 
  reward 
}: RewardAnimationProps) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter")
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([])

  useEffect(() => {
    if (!isVisible) {
      setPhase("enter")
      return
    }

    // Generate particles
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5
    }))
    setParticles(newParticles)

    // Animation phases
    const showTimer = setTimeout(() => setPhase("show"), 100)
    const exitTimer = setTimeout(() => setPhase("exit"), 2500)
    const completeTimer = setTimeout(() => {
      onComplete()
      setPhase("enter")
    }, 3000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(exitTimer)
      clearTimeout(completeTimer)
    }
  }, [isVisible, onComplete])

  if (!isVisible) return null

  const typeConfig = {
    success: {
      icon: CheckCircle,
      color: "text-neon-green",
      bgColor: "bg-neon-green/20",
      borderColor: "border-neon-green",
      glowColor: "glow-green" as const
    },
    achievement: {
      icon: Star,
      color: "text-accent",
      bgColor: "bg-accent/20",
      borderColor: "border-accent",
      glowColor: "magenta" as const
    },
    level_up: {
      icon: Zap,
      color: "text-primary",
      bgColor: "bg-primary/20",
      borderColor: "border-primary",
      glowColor: "cyan" as const
    }
  }

  const config = typeConfig[reward.type || "success"]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-300 ${
          phase === "show" ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Particle Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute w-2 h-2 rounded-full ${config.bgColor} transition-all duration-1000 ${
              phase === "show" ? "opacity-100" : "opacity-0"
            }`}
            style={{
              left: `${particle.x}%`,
              top: phase === "show" ? `${particle.y}%` : "50%",
              transitionDelay: `${particle.delay}s`,
              transform: phase === "show" ? "scale(1)" : "scale(0)",
              boxShadow: `0 0 10px var(--${config.color.replace('text-', '')})`,
            }}
          />
        ))}
      </div>

      {/* Main Reward Card */}
      <div 
        className={`relative transition-all duration-500 ${
          phase === "enter" ? "opacity-0 scale-50" : 
          phase === "show" ? "opacity-100 scale-100" : 
          "opacity-0 scale-110 translate-y-[-20px]"
        }`}
      >
        <GlassPanel 
          className={`p-6 text-center border-2 ${config.borderColor}`}
          variant="strong"
          glowColor={config.glowColor}
        >
          {/* Icon with pulse animation */}
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}>
            <Icon className={`w-8 h-8 ${config.color} animate-pulse`} />
          </div>

          {/* Message */}
          <h3 className="text-lg font-mono text-foreground font-bold mb-2">
            {reward.message || "Verified!"}
          </h3>

          {/* Rewards */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xl font-mono font-bold text-primary">+{reward.xp}</span>
              <span className="text-xs font-mono text-muted-foreground">XP</span>
            </div>
            
            {reward.blockProgress && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-xl font-mono font-bold text-accent">+{reward.blockProgress}%</span>
                <span className="text-xs font-mono text-muted-foreground">Block</span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="mt-4 pt-3 border-t border-border">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Quest Complete
            </span>
          </div>
        </GlassPanel>

        {/* Radial glow effect */}
        <div 
          className={`absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-500 ${
            phase === "show" ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: `radial-gradient(circle at center, var(--${config.color.replace('text-', '')}) 0%, transparent 70%)`,
            filter: "blur(40px)",
            transform: "scale(1.5)",
            zIndex: -1
          }}
        />
      </div>
    </div>
  )
}
