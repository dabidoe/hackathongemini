"use client"

import { useRef } from "react"
import { Heart, Star, ChevronRight } from "lucide-react"
import Image from "next/image"

interface NPCCardData {
  id: string
  name: string
  title: string
  imageUrl?: string
  avatarInitial: string
  trustLevel: number
  taskPreview: string
  taskType: "photo" | "yes_no" | "confirm" | "location"
}

interface NPCCardStripProps {
  npcs: NPCCardData[]
  onNPCSelect: (npcId: string) => void
  selectedNPCId?: string
}

export function NPCCardStrip({ npcs, onNPCSelect, selectedNPCId }: NPCCardStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const getTrustColor = (level: number) => {
    if (level >= 80) return "text-accent"
    if (level >= 50) return "text-primary"
    return "text-muted-foreground"
  }

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case "photo": return "Photo"
      case "yes_no": return "Survey"
      case "confirm": return "Verify"
      case "location": return "Visit"
      default: return "Task"
    }
  }

  // Split NPCs into pairs for double stacking
  const npcPairs: NPCCardData[][] = []
  for (let i = 0; i < npcs.length; i += 2) {
    npcPairs.push(npcs.slice(i, i + 2))
  }

  const renderCard = (npc: NPCCardData) => (
    <button
      key={npc.id}
      onClick={() => onNPCSelect(npc.id)}
      className={`w-full rounded-lg transition-all duration-200 ${
        selectedNPCId === npc.id 
          ? "border-2 border-primary bg-primary/5" 
          : "border border-border bg-card/80 hover:border-primary/50"
      }`}
    >
      {/* Card Content */}
      <div className="flex items-stretch">
        {/* Avatar Section */}
        <div className="relative w-16 h-16 flex-shrink-0 rounded-l-lg overflow-hidden">
          {npc.imageUrl ? (
            <Image
              src={npc.imageUrl}
              alt={npc.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-xl font-mono font-bold text-primary">
                {npc.avatarInitial}
              </span>
            </div>
          )}
          {/* Task Type Badge */}
          <div className="absolute bottom-0.5 left-0.5 px-1 py-0.5 rounded bg-background/90 backdrop-blur-sm">
            <span className="text-[7px] font-mono text-primary uppercase font-bold">
              {getTaskTypeLabel(npc.taskType)}
            </span>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 p-2 flex flex-col justify-between text-left min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h4 className="text-xs font-mono font-bold text-foreground truncate">
                {npc.name}
              </h4>
              <div className={`flex items-center gap-0.5 flex-shrink-0 ${getTrustColor(npc.trustLevel)}`}>
                <Heart className="w-2.5 h-2.5" />
                <span className="text-[9px] font-mono">{npc.trustLevel}%</span>
              </div>
            </div>
            <p className="text-[9px] font-mono text-primary uppercase tracking-wide truncate">
              {npc.title}
            </p>
          </div>
          
          {/* Task Preview */}
          <p className="text-[9px] font-mono text-muted-foreground line-clamp-1 leading-tight">
            {npc.taskPreview}
          </p>
        </div>

        {/* Arrow Indicator */}
        <div className="flex items-center pr-2">
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
    </button>
  )

  return (
    <div className="relative">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 mb-2">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Nearby Contacts</h3>
        <span className="text-[10px] font-mono text-primary">{npcs.length} available</span>
      </div>

      {/* Horizontal Scroll Container with Double Stacked Cards */}
      <div 
        ref={scrollRef}
        className="flex gap-3 px-4 pb-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {npcPairs.map((pair, pairIndex) => (
          <div 
            key={pairIndex} 
            className="flex-shrink-0 w-60 snap-start flex flex-col gap-2"
          >
            {pair.map((npc) => renderCard(npc))}
          </div>
        ))}
      </div>

      {/* Scroll Fade Indicators */}
      <div className="absolute left-0 top-8 bottom-2 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-8 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  )
}
