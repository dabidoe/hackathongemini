"use client"

import { useState } from "react"
import { ChevronRight, Zap, Camera, Check, X, Clock, HelpCircle, MapPin } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export interface MicroQuestData {
  id: string
  type: "photo" | "yes_no" | "description" | "confirm" | "location"
  title: string
  description: string
  question?: string
  hint?: string
  reward: { xp: number; blockProgress?: number }
}

interface NPCCardData {
  id: string
  name: string
  title: string
  imageUrl?: string
  avatarInitial: string
  trustLevel: number
  taskPreview: string
  taskType: "photo" | "yes_no" | "description" | "confirm" | "location"
  xpEarned?: number
  microQuest?: MicroQuestData
}

interface NPCCardStripProps {
  npcs: NPCCardData[]
  onNPCSelect: (npcId: string) => void
  selectedNPCId?: string
  activeNPCId?: string | null
  onActivate?: (npcId: string) => void
  expandedNPCId?: string | null
  onPhotoCapture?: (npcId: string) => void
  onQuestComplete?: (npcId: string, answer: string | boolean) => void
  isSubmitting?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  photo: "Upload Photo",
  yes_no: "Survey",
  description: "Description",
  confirm: "Confirmation",
  location: "Location Check",
}

export function NPCCardStrip({
  npcs,
  onNPCSelect,
  selectedNPCId,
  activeNPCId = null,
  onActivate,
  expandedNPCId = null,
  onPhotoCapture,
  onQuestComplete,
  isSubmitting = false,
}: NPCCardStripProps) {
  const [yesNoAnswers, setYesNoAnswers] = useState<Record<string, boolean | null>>({})
  const [descriptionAnswers, setDescriptionAnswers] = useState<Record<string, string>>({})

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case "photo": return "Upload Photo"
      case "yes_no": return "Survey"
      case "description": return "Description"
      case "confirm": return "Verify"
      case "location": return "Visit"
      default: return "Task"
    }
  }

  const renderCard = (npc: NPCCardData) => {
    const isActive = activeNPCId === npc.id
    const isExpanded = expandedNPCId === npc.id && npc.microQuest
    const quest = npc.microQuest
    const selectedAnswer = quest?.type === "yes_no" ? (yesNoAnswers[npc.id] ?? null) : null

    return (
      <div
        key={npc.id}
        className={`w-full min-w-0 rounded-lg transition-all duration-200 overflow-hidden ${
          isActive
            ? "border-2 border-neon-green bg-neon-green/5 shadow-[0_0_12px_var(--neon-green)]"
            : "border border-border bg-card/80 hover:border-primary/50"
        }`}
      >
        <button
          className="w-full text-left"
          onClick={() => onNPCSelect(npc.id)}
        >
          {/* Card Content - responsive flex */}
          <div className="flex items-stretch min-w-0">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-l-lg overflow-hidden">
              {npc.imageUrl ? (
                <Image src={npc.imageUrl} alt={npc.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className={`text-lg sm:text-xl font-mono font-bold ${isActive ? "text-neon-green" : "text-foreground/80"}`}>
                    {npc.avatarInitial}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 p-2 sm:p-2.5 flex flex-col justify-between text-left min-w-0 overflow-hidden">
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className="text-xs font-mono font-bold text-foreground truncate">{npc.name}</h4>
                  <span className={`text-[9px] font-mono flex-shrink-0 ${isActive ? "text-neon-green" : "text-muted-foreground"}`}>
                    {npc.xpEarned ?? 0} XP points awarded
                  </span>
                </div>
                <p className="text-[9px] font-mono text-primary uppercase tracking-wide truncate">{npc.title}</p>
              </div>
              <p className="text-[9px] sm:text-[10px] font-mono text-muted-foreground line-clamp-2 sm:line-clamp-1 leading-tight">
                <span className="text-foreground font-medium">{getTaskTypeLabel(npc.taskType)}:</span> {npc.taskPreview}
              </p>
            </div>
            <div className="flex items-center pr-2 flex-shrink-0">
              <ChevronRight className={`w-3 h-3 ${isActive ? "text-neon-green" : "text-muted-foreground"}`} />
            </div>
          </div>
        </button>

        {/* Inline quest content when expanded - no pop-up */}
        {isExpanded && quest && (
          <div className="border-t border-neon-green/30 bg-neon-green/5 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-neon-green uppercase tracking-widest">{TYPE_LABELS[quest.type] || "Task"}</span>
              <span className="text-[10px] font-mono font-bold text-neon-green">+{quest.reward.xp} XP</span>
            </div>
            <p className="text-xs font-mono text-foreground/90 leading-relaxed">{quest.description}</p>
            {quest.question && (
              <div className="bg-neon-green/10 rounded-lg p-2 border border-neon-green/30">
                <p className="text-xs font-mono text-foreground text-center">{quest.question}</p>
              </div>
            )}
            {quest.hint && (
              <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {quest.hint}
              </p>
            )}
            <div className="space-y-2">
              {quest.type === "photo" && (
                <Button
                  className="w-full h-9 font-mono text-xs bg-neon-green/20 border border-neon-green text-neon-green hover:bg-neon-green/30"
                  onClick={(e) => { e.stopPropagation(); onPhotoCapture?.(npc.id) }}
                  disabled={isSubmitting}
                >
                  <Camera className="w-3.5 h-3.5 mr-2" />
                  {isSubmitting ? "Uploading..." : "Upload Photo"}
                </Button>
              )}
              {quest.type === "yes_no" && (
                <div className="flex gap-2">
                  <Button
                    className={`flex-1 h-9 font-mono text-xs border ${selectedAnswer === true ? "bg-neon-green/30 border-neon-green text-neon-green" : "bg-neon-green/10 border-neon-green/50 text-neon-green hover:bg-neon-green/20"}`}
                    onClick={(e) => { e.stopPropagation(); setYesNoAnswers((a) => ({ ...a, [npc.id]: true })); onQuestComplete?.(npc.id, true) }}
                    disabled={isSubmitting || selectedAnswer !== null}
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" /> Yes
                  </Button>
                  <Button
                    className={`flex-1 h-9 font-mono text-xs border ${selectedAnswer === false ? "bg-destructive/30 border-destructive text-destructive" : "bg-destructive/10 border-destructive/50 text-destructive hover:bg-destructive/20"}`}
                    onClick={(e) => { e.stopPropagation(); setYesNoAnswers((a) => ({ ...a, [npc.id]: false })); onQuestComplete?.(npc.id, false) }}
                    disabled={isSubmitting || selectedAnswer !== null}
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" /> No
                  </Button>
                </div>
              )}
              {quest.type === "description" && (
                <>
                  <div className="rounded-lg border border-neon-green/30 bg-background/50 p-2">
                    <Textarea
                      placeholder="Type your answer..."
                      value={descriptionAnswers[npc.id] ?? ""}
                      onChange={(e) => setDescriptionAnswers((a) => ({ ...a, [npc.id]: e.target.value }))}
                      className="min-h-[80px] text-xs font-mono resize-none border-0 bg-transparent placeholder:text-muted-foreground/60 focus-visible:ring-0"
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button
                    className="w-full h-9 font-mono text-xs bg-neon-green/20 border border-neon-green text-neon-green hover:bg-neon-green/30"
                    onClick={(e) => {
                      e.stopPropagation()
                      const text = descriptionAnswers[npc.id]?.trim()
                      if (text) onQuestComplete?.(npc.id, text)
                    }}
                    disabled={isSubmitting || !(descriptionAnswers[npc.id]?.trim())}
                  >
                    <Check className="w-3.5 h-3.5 mr-2" />
                    Submit
                  </Button>
                </>
              )}
              {(quest.type === "confirm" || quest.type === "location") && (
                <Button
                  className="w-full h-9 font-mono text-xs bg-neon-green/20 border border-neon-green text-neon-green hover:bg-neon-green/30"
                  onClick={(e) => { e.stopPropagation(); onQuestComplete?.(npc.id, true) }}
                  disabled={isSubmitting}
                >
                  <Check className="w-3.5 h-3.5 mr-2" /> {quest.type === "location" ? "I'm Here" : "Confirm"}
                </Button>
              )}
            </div>
            {quest.reward.blockProgress && (
              <div className="pt-2 border-t border-neon-green/30 flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>Block Progress</span>
                <span className="text-neon-green">+{quest.reward.blockProgress}%</span>
              </div>
            )}
          </div>
        )}

        {onActivate && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onActivate(npc.id) }}
            className={`w-full py-1.5 px-2 border-t flex items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              isActive ? "border-neon-green/40 bg-neon-green/15 text-neon-green" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Zap className="w-3 h-3" />
            {isActive ? "Active" : "Activate"}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-full min-w-0">
      {/* Section Header - responsive padding */}
      <div className="flex items-center justify-between px-3 sm:px-4 mb-2">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Nearby Contacts</h3>
        <span className="text-[10px] font-mono text-primary">{npcs.length} available</span>
      </div>

      {/* Responsive grid: 1 col mobile, auto-fill from 260px on larger screens */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 pb-2 w-full [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
        {npcs.map((npc) => renderCard(npc))}
      </div>
    </div>
  )
}
