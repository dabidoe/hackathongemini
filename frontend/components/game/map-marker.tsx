"use client"

import { useState } from "react"
import Image from "next/image"
import { Landmark, AlertCircle, HelpCircle, Star, User } from "lucide-react"

type MarkerType = "npc" | "quest" | "mystery" | "completed" | "player"

interface MapMarkerProps {
  type: MarkerType
  name: string
  distance?: number
  isActive?: boolean
  onClick?: () => void
  style?: React.CSSProperties
  avatarUrl?: string
}

export function MapMarker({
  type,
  name,
  distance,
  isActive = false,
  onClick,
  style,
  avatarUrl,
}: MapMarkerProps) {
  const [isHovered, setIsHovered] = useState(false)

  const markerStyles: Record<MarkerType, { bg: string; border: string; icon: typeof Landmark; iconColor: string; glow: string }> = {
    npc: {
      bg: "bg-primary/20",
      border: "border-primary",
      icon: Landmark,
      iconColor: "text-primary",
      glow: "glow-cyan"
    },
    quest: {
      bg: "bg-accent/20",
      border: "border-accent",
      icon: AlertCircle,
      iconColor: "text-accent",
      glow: "glow-magenta"
    },
    mystery: {
      bg: "bg-muted",
      border: "border-muted-foreground",
      icon: HelpCircle,
      iconColor: "text-muted-foreground",
      glow: ""
    },
    completed: {
      bg: "bg-accent/20",
      border: "border-accent",
      icon: Star,
      iconColor: "text-accent",
      glow: "glow-magenta"
    },
    player: {
      bg: "bg-primary/30",
      border: "border-primary",
      icon: User,
      iconColor: "text-primary",
      glow: "glow-cyan"
    }
  }

  const styles = markerStyles[type]
  const Icon = styles.icon

  return (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${type === "player" && !onClick ? "cursor-default" : "cursor-pointer"}`}
      style={style}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Pulse ring for active/quest/player markers */}
      {(isActive || type === "quest" || type === "player") && (
        <div
          className={`absolute inset-0 ${styles.bg} rounded-full animate-ping opacity-75`}
          style={{ animationDuration: "2s" }}
        />
      )}

      {/* Main marker */}
      <div
        className={`
        relative w-10 h-10 rounded-full
        ${styles.bg} ${styles.border} border-2
        flex items-center justify-center overflow-hidden
        transition-transform duration-200
        ${isActive ? styles.glow : ""}
        ${type === "player" ? styles.glow : ""}
        ${isHovered && type !== "player" ? "scale-110" : ""}
      `}
      >
        {type === "player" && avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="You"
            width={40}
            height={40}
            className="w-full h-full object-cover"
            unoptimized={avatarUrl.startsWith("blob:") || avatarUrl.includes("picsum")}
          />
        ) : (
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        )}
      </div>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap z-10">
          <div className="glass px-2 py-1 rounded text-center">
            <span className="text-xs font-mono text-foreground block">{name}</span>
            {distance !== undefined && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Direction indicator (pointer) - omit for player */}
      {type !== "player" && (
        <div
          className={`
        absolute top-full left-1/2 -translate-x-1/2 -mt-1
        w-0 h-0
        border-l-[6px] border-l-transparent
        border-r-[6px] border-r-transparent
        border-t-[8px] ${styles.border.replace("border", "border-t")}
      `}
        />
      )}
    </div>
  )
}
