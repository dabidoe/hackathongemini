"use client"

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface GlassPanelProps {
  children: ReactNode
  className?: string
  glowColor?: "cyan" | "magenta" | "green" | "none"
  variant?: "default" | "strong"
}

export function GlassPanel({ 
  children, 
  className, 
  glowColor = "none",
  variant = "default" 
}: GlassPanelProps) {
  const glowClasses = {
    cyan: "glow-cyan",
    magenta: "glow-magenta", 
    green: "glow-green",
    none: ""
  }

  return (
    <div className={cn(
      variant === "default" ? "glass" : "glass-strong",
      "rounded-lg",
      glowClasses[glowColor],
      className
    )}>
      {children}
    </div>
  )
}
