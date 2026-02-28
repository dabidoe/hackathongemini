"use client"

import { useState } from "react"
import { Camera, Check, X, MapPin, Clock, HelpCircle } from "lucide-react"
import { GlassPanel } from "./glass-panel"
import { Button } from "@/components/ui/button"

type QuestType = "photo" | "yes_no" | "confirm" | "location"

interface MicroQuest {
  id: string
  type: QuestType
  title: string
  description: string
  question?: string
  hint?: string
  reward: {
    xp: number
    blockProgress?: number
  }
}

interface QuestCardProps {
  quest: MicroQuest
  onComplete: (answer: string | boolean) => void
  onPhotoCapture?: () => void
  isSubmitting?: boolean
}

export function QuestCard({ 
  quest, 
  onComplete, 
  onPhotoCapture,
  isSubmitting = false 
}: QuestCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null)

  const typeConfig = {
    photo: {
      icon: Camera,
      iconColor: "text-accent",
      label: "Photo Quest"
    },
    yes_no: {
      icon: HelpCircle,
      iconColor: "text-primary",
      label: "Quick Check"
    },
    confirm: {
      icon: Check,
      iconColor: "text-neon-green",
      label: "Confirmation"
    },
    location: {
      icon: MapPin,
      iconColor: "text-primary",
      label: "Location Check"
    }
  }

  const config = typeConfig[quest.type]
  const Icon = config.icon

  const handleYesNoSubmit = (answer: boolean) => {
    setSelectedAnswer(answer)
    onComplete(answer)
  }

  return (
    <GlassPanel 
      className="p-3"
      variant="strong"
      glowColor={quest.type === "photo" ? "magenta" : "cyan"}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg bg-background/50 border border-border flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <div className="flex-1">
          <span className={`text-[9px] font-mono ${config.iconColor} uppercase tracking-widest`}>
            {config.label}
          </span>
          <h3 className="text-sm font-mono text-foreground font-medium -mt-0.5 line-clamp-1">
            {quest.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-neon-green">
          <span className="text-[10px] font-mono font-bold">+{quest.reward.xp} XP</span>
        </div>
      </div>

      {/* Quest Description */}
      <p className="text-xs font-mono text-foreground/80 mb-3 leading-relaxed">
        {quest.description}
      </p>

      {/* Quest Question (for yes/no) */}
      {quest.question && (
        <div className="bg-muted/30 rounded-lg p-2 mb-3 border border-border">
          <p className="text-xs font-mono text-foreground text-center">
            {quest.question}
          </p>
        </div>
      )}

      {/* Hint */}
      {quest.hint && (
        <p className="text-[10px] font-mono text-muted-foreground mb-3 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {quest.hint}
        </p>
      )}

      {/* Actions based on quest type */}
      <div className="space-y-2">
        {quest.type === "photo" && (
          <Button
            className="w-full h-10 font-mono text-xs bg-accent/20 border border-accent text-accent hover:bg-accent/30"
            onClick={onPhotoCapture}
            disabled={isSubmitting}
          >
            <Camera className="w-4 h-4 mr-2" />
            {isSubmitting ? "Uploading..." : "Take Photo"}
          </Button>
        )}

        {quest.type === "yes_no" && (
          <div className="flex gap-2">
            <Button
              className={`flex-1 h-10 font-mono text-xs border ${
                selectedAnswer === true 
                  ? 'bg-neon-green/30 border-neon-green text-neon-green' 
                  : 'bg-neon-green/10 border-neon-green/50 text-neon-green hover:bg-neon-green/20'
              }`}
              onClick={() => handleYesNoSubmit(true)}
              disabled={isSubmitting || selectedAnswer !== null}
            >
              <Check className="w-4 h-4 mr-1.5" />
              Yes
            </Button>
            <Button
              className={`flex-1 h-10 font-mono text-xs border ${
                selectedAnswer === false 
                  ? 'bg-destructive/30 border-destructive text-destructive' 
                  : 'bg-destructive/10 border-destructive/50 text-destructive hover:bg-destructive/20'
              }`}
              onClick={() => handleYesNoSubmit(false)}
              disabled={isSubmitting || selectedAnswer !== null}
            >
              <X className="w-4 h-4 mr-1.5" />
              No
            </Button>
          </div>
        )}

        {quest.type === "confirm" && (
          <Button
            className="w-full h-10 font-mono text-xs bg-primary/20 border border-primary text-primary hover:bg-primary/30"
            onClick={() => onComplete(true)}
            disabled={isSubmitting}
          >
            <Check className="w-4 h-4 mr-2" />
            {isSubmitting ? "Confirming..." : "Confirm"}
          </Button>
        )}

        {quest.type === "location" && (
          <Button
            className="w-full h-10 font-mono text-xs bg-primary/20 border border-primary text-primary hover:bg-primary/30"
            onClick={() => onComplete(true)}
            disabled={isSubmitting}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {isSubmitting ? "Checking..." : "I'm Here"}
          </Button>
        )}
      </div>

      {/* Reward Preview */}
      {quest.reward.blockProgress && (
        <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground">Block Progress</span>
          <span className="text-[10px] font-mono text-primary">+{quest.reward.blockProgress}%</span>
        </div>
      )}
    </GlassPanel>
  )
}
