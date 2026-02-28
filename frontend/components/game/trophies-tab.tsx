"use client"

import { Trophy, CheckCircle2, Award, Camera, ClipboardCheck, MapPin, Star } from "lucide-react"
import { GlassPanel } from "./glass-panel"

export interface CompletedTask {
  id: string
  title: string
  type: "photo" | "survey" | "verify" | "visit"
  xpEarned: number
  npcName: string
  completedAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: "camera" | "clipboard" | "map" | "star" | "trophy"
  unlockedAt: string
}

const typeLabel: Record<CompletedTask["type"], string> = {
  photo: "Photo",
  survey: "Survey",
  verify: "Verify",
  visit: "Visit",
}

const badgeIcons = {
  camera: Camera,
  clipboard: ClipboardCheck,
  map: MapPin,
  star: Star,
  trophy: Trophy,
}

interface TrophiesTabProps {
  completedTasks?: CompletedTask[]
  badges?: Badge[]
}

const defaultCompletedTasks: CompletedTask[] = [
  { id: "1", title: "Storefront photo for the network", type: "photo", xpEarned: 50, npcName: "ZERO", completedAt: "2h ago" },
  { id: "2", title: "Accessibility features survey", type: "survey", xpEarned: 45, npcName: "CIPHER", completedAt: "1d ago" },
  { id: "3", title: "Verify location at Neon Hub", type: "verify", xpEarned: 30, npcName: "ECHO", completedAt: "2d ago" },
  { id: "4", title: "Scavenger drop-off confirmation", type: "verify", xpEarned: 60, npcName: "NOVA", completedAt: "3d ago" },
]

const defaultBadges: Badge[] = [
  { id: "1", name: "First Shot", description: "Complete your first photo task", icon: "camera", unlockedAt: "1w ago" },
  { id: "2", name: "Survey Scout", description: "Complete 3 survey tasks", icon: "clipboard", unlockedAt: "5d ago" },
  { id: "3", name: "Neon Explorer", description: "Visit 5 locations in Neon District", icon: "map", unlockedAt: "3d ago" },
  { id: "4", name: "Trust Builder", description: "Reach 80% trust with an NPC", icon: "star", unlockedAt: "2d ago" },
  { id: "5", name: "Task Runner", description: "Complete 10 tasks", icon: "trophy", unlockedAt: "1d ago" },
]

export function TrophiesTab({ completedTasks = defaultCompletedTasks, badges = defaultBadges }: TrophiesTabProps) {
  return (
    <div className="absolute bottom-24 left-0 right-0 max-h-[60vh] overflow-y-auto pointer-events-auto z-25 bg-background/95 backdrop-blur-md border-t border-border">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Trophies</h2>
        </div>

        {/* Completed Tasks */}
        <section>
          <h3 className="text-xs font-mono text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed Tasks
          </h3>
          <ul className="space-y-2">
            {completedTasks.map((task) => (
              <li key={task.id}>
                <GlassPanel className="p-3" variant="strong">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-foreground font-medium leading-tight">
                        {task.title}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {typeLabel[task.type]} · {task.npcName} · {task.completedAt}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-primary flex-shrink-0">
                      +{task.xpEarned} XP
                    </span>
                  </div>
                </GlassPanel>
              </li>
            ))}
          </ul>
        </section>

        {/* Badges Earned */}
        <section>
          <h3 className="text-xs font-mono text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            Badges Earned
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.map((badge) => {
              const Icon = badgeIcons[badge.icon]
              return (
                <GlassPanel key={badge.id} className="p-3 text-center" variant="strong" glowColor="cyan">
                  <div className="w-10 h-10 mx-auto rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-[10px] font-mono font-bold text-foreground uppercase leading-tight">
                    {badge.name}
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground mt-0.5 line-clamp-2">
                    {badge.description}
                  </p>
                  <p className="text-[8px] font-mono text-primary/80 mt-1">
                    {badge.unlockedAt}
                  </p>
                </GlassPanel>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
