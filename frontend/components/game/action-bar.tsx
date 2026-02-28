"use client"

import { Map, User, Trophy, Settings, Compass } from "lucide-react"
import { GlassPanel } from "./glass-panel"

type Tab = "map" | "quests" | "profile" | "achievements" | "settings"

interface ActionBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  questCount?: number
  newAchievements?: number
}

export function ActionBar({ 
  activeTab, 
  onTabChange,
  questCount = 0,
  newAchievements = 0
}: ActionBarProps) {
  const tabs: { id: Tab; icon: typeof Map; label: string; badge?: number }[] = [
    { id: "map", icon: Compass, label: "Map" },
    { id: "quests", icon: Map, label: "Quests", badge: questCount },
    { id: "profile", icon: User, label: "Profile" },
    { id: "achievements", icon: Trophy, label: "Trophies", badge: newAchievements },
    { id: "settings", icon: Settings, label: "Settings" },
  ]

  const handleClick = (tab: Tab) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onTabChange(tab)
  }

  return (
    <GlassPanel className="p-1.5 safe-area-bottom" variant="strong">
      <div className="flex items-center justify-around gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={handleClick(tab.id)}
              className={`
                relative flex flex-col items-center justify-center
                w-14 h-14 md:w-16 md:h-14 rounded-lg
                transition-all duration-200 active:scale-95
                touch-manipulation select-none cursor-pointer
                ${isActive 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70 border border-transparent'
                }
              `}
            >
              <Icon className={`w-5 h-5 md:w-5 md:h-5 ${isActive ? '' : ''}`} />
              <span className="text-[9px] md:text-[10px] font-mono mt-0.5 uppercase tracking-wide">
                {tab.label}
              </span>
              
              {/* Badge */}
              {tab.badge && tab.badge > 0 && (
                <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent flex items-center justify-center animate-pulse pointer-events-none">
                  <span className="text-[9px] font-mono text-accent-foreground font-bold">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                </div>
              )}

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </GlassPanel>
  )
}
