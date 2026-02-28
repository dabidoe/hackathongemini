"use client"

import { Target, ChevronRight, CheckCircle2, Circle, Camera } from "lucide-react"
import { GlassPanel } from "./glass-panel"

export interface Quest {
  id: string
  title: string
  description: string
  objectives: {
    id: string
    text: string
    completed: boolean
    requiresPhoto?: boolean
  }[]
  reward: {
    xp: number
    credits?: number
  }
  distance?: number
  npcName: string
}

interface QuestTrackerProps {
  activeQuest: Quest | null
  onQuestClick?: () => void
  /** Number of tasks currently activated (Activate button). When > 0, banner shows "Active mission: N" */
  activeMissionCount?: number
}

export function QuestTracker({ activeQuest, onQuestClick, activeMissionCount = 0 }: QuestTrackerProps) {
  if (!activeQuest) {
    const hasActive = activeMissionCount > 0
    return (
      <GlassPanel className="p-3" glowColor={hasActive ? "green" : "cyan"}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Target className={`w-4 h-4 ${hasActive ? "text-neon-green" : ""}`} />
          <span className={`text-xs font-mono uppercase tracking-wider ${hasActive ? "text-neon-green" : ""}`}>
            {hasActive
              ? `Active mission${activeMissionCount !== 1 ? "s" : ""}: ${activeMissionCount}`
              : "No Active Mission"}
          </span>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground/60 mt-1 ml-6">
          {hasActive ? "Open Quests tab to view" : "Tap a marker to receive a quest"}
        </p>
      </GlassPanel>
    )
  }

  const completedCount = activeQuest.objectives.filter(o => o.completed).length
  const progress = (completedCount / activeQuest.objectives.length) * 100

  return (
    <GlassPanel 
      className="p-3 cursor-pointer active:scale-[0.98] transition-transform"
      glowColor="cyan"
      onClick={onQuestClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary animate-pulse-glow" />
          <div>
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest">
              Active Mission
            </span>
            <h3 className="text-sm font-mono text-foreground font-medium -mt-0.5">
              {activeQuest.title}
            </h3>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Progress Bar */}
      <div className="mt-2 mb-2">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Objectives */}
      <div className="space-y-1">
        {activeQuest.objectives.slice(0, 2).map((objective) => (
          <div key={objective.id} className="flex items-center gap-2">
            {objective.completed ? (
              <CheckCircle2 className="w-3 h-3 text-neon-green flex-shrink-0" />
            ) : (
              <Circle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
            <span className={`text-[11px] font-mono flex-1 ${
              objective.completed ? 'text-muted-foreground line-through' : 'text-foreground/80'
            }`}>
              {objective.text}
            </span>
            {objective.requiresPhoto && !objective.completed && (
              <Camera className="w-3 h-3 text-accent" />
            )}
          </div>
        ))}
        {activeQuest.objectives.length > 2 && (
          <span className="text-[10px] font-mono text-muted-foreground ml-5">
            +{activeQuest.objectives.length - 2} more objectives
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground">
            NPC: <span className="text-accent">{activeQuest.npcName}</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-neon-green">
            +{activeQuest.reward.xp} XP
          </span>
          {activeQuest.reward.credits && (
            <span className="text-[10px] font-mono text-primary">
              +{activeQuest.reward.credits}¢
            </span>
          )}
        </div>
      </div>
    </GlassPanel>
  )
}
