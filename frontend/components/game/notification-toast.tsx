"use client"

import { useEffect, useState } from "react"
import { CheckCircle, AlertTriangle, Info, Star, X, Zap, TrendingUp } from "lucide-react"
import { GlassPanel } from "./glass-panel"

type NotificationType = "success" | "warning" | "info" | "achievement" | "xp_gain"

interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  xpGain?: number
  progressGain?: number
}

interface NotificationToastProps {
  notification: Notification
  onDismiss: (id: string) => void
}

export function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [isEntering, setIsEntering] = useState(true)

  const typeStyles = {
    success: {
      icon: CheckCircle,
      iconColor: "text-neon-green",
      glow: "green" as const,
      border: "border-l-neon-green",
      animate: true
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-destructive",
      glow: "none" as const,
      border: "border-l-destructive",
      animate: false
    },
    info: {
      icon: Info,
      iconColor: "text-primary",
      glow: "cyan" as const,
      border: "border-l-primary",
      animate: false
    },
    achievement: {
      icon: Star,
      iconColor: "text-accent",
      glow: "magenta" as const,
      border: "border-l-accent",
      animate: true
    },
    xp_gain: {
      icon: Zap,
      iconColor: "text-primary",
      glow: "cyan" as const,
      border: "border-l-primary",
      animate: true
    }
  }

  const style = typeStyles[notification.type]
  const Icon = style.icon

  useEffect(() => {
    // Entry animation
    const entryTimer = setTimeout(() => setIsEntering(false), 50)
    
    const duration = notification.duration ?? 4000
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onDismiss(notification.id), 300)
    }, duration)

    return () => {
      clearTimeout(entryTimer)
      clearTimeout(timer)
    }
  }, [notification, onDismiss])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => onDismiss(notification.id), 300)
  }

  return (
    <div className={`
      transition-all duration-300 ease-out
      ${isEntering ? 'opacity-0 translate-x-8 scale-95' : ''}
      ${isExiting ? 'opacity-0 translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'}
    `}>
      <GlassPanel 
        className={`p-3 border-l-2 ${style.border} ${style.animate ? 'animate-glow-pulse' : ''}`}
        glowColor={style.glow}
      >
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 ${style.animate ? 'animate-pulse' : ''}`} />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-mono text-foreground font-medium">
              {notification.title}
            </h4>
            {notification.message && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                {notification.message}
              </p>
            )}
            {/* XP/Progress gains inline */}
            {(notification.xpGain || notification.progressGain) && (
              <div className="flex items-center gap-3 mt-1.5">
                {notification.xpGain && (
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-xs font-mono font-bold text-primary">+{notification.xpGain} XP</span>
                  </div>
                )}
                {notification.progressGain && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-accent" />
                    <span className="text-xs font-mono font-bold text-accent">+{notification.progressGain}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <button 
            onClick={handleDismiss}
            className="p-0.5 rounded hover:bg-muted transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </GlassPanel>
    </div>
  )
}

interface NotificationStackProps {
  notifications: Notification[]
  onDismiss: (id: string) => void
}

export function NotificationStack({ notifications, onDismiss }: NotificationStackProps) {
  return (
    <div className="fixed top-20 right-4 z-40 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationToast 
            notification={notification} 
            onDismiss={onDismiss}
          />
        </div>
      ))}
    </div>
  )
}
