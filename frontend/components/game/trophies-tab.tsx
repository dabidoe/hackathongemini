"use client"

import { Trophy, CheckCircle2, Award, Users, X, Medal } from "lucide-react"
import { GlassPanel } from "./glass-panel"
import Image from "next/image"

export interface CompletedTaskEntry {
  id: string
  placeId: string
  placeName: string
  characterId: string
  characterName: string
  taskTitle: string
  xpEarned: number
  type: "photo" | "yes_no" | "description" | "confirm" | "location"
  completedAt: string
}

export interface NPCForTrophies {
  id: string
  name: string
  character?: { imageUrl?: string }
}

interface TrophiesTabProps {
  completedTasks?: CompletedTaskEntry[]
  npcs?: NPCForTrophies[]
  playerStats?: { level: number; xp: number; questsCompleted: number }
  onClose?: () => void
}

const typeLabel: Record<string, string> = {
  photo: "Photo",
  yes_no: "Survey",
  description: "Description",
  confirm: "Verify",
  location: "Visit",
}

function formatCompletedAt(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffM = Math.floor(diffMs / 60000)
    const diffH = Math.floor(diffMs / 3600000)
    const diffD = Math.floor(diffMs / 86400000)
    if (diffM < 1) return "Just now"
    if (diffM < 60) return `${diffM}m ago`
    if (diffH < 24) return `${diffH}h ago`
    if (diffD < 7) return `${diffD}d ago`
    return d.toLocaleDateString()
  } catch {
    return ""
  }
}

const MOCK_LEADERBOARD_ENTRIES = [
  { name: "RUNNER_X7", xp: 1850 },
  { name: "NEON_GHOST", xp: 1620 },
  { name: "CIPHER_99", xp: 1480 },
  { name: "ECHO_PRIME", xp: 1310 },
  { name: "ZERO_ONE", xp: 980 },
]

export function TrophiesTab({
  completedTasks = [],
  npcs = [],
  playerStats,
  onClose,
}: TrophiesTabProps) {
  const tasksByNewest = [...completedTasks].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )
  const uniqueCharacterIds = Array.from(
    new Set(completedTasks.map((t) => t.characterId))
  )
  const charactersWorkedWith = uniqueCharacterIds
    .map((id) => npcs.find((n) => n.id === id))
    .filter(Boolean) as NPCForTrophies[]

  const currentUserXp = playerStats?.xp ?? 0
  const leaderboardEntries = [
    { name: "RUNNER_X7", xp: currentUserXp, isCurrentUser: true },
    ...MOCK_LEADERBOARD_ENTRIES.filter((e) => e.name !== "RUNNER_X7").map((e) => ({
      name: e.name,
      xp: e.xp,
      isCurrentUser: false as const,
    })),
  ]
  const leaderboard = leaderboardEntries
    .sort((a, b) => b.xp - a.xp)
    .map((row, i) => ({ ...row, rank: i + 1 }))

  return (
    <div className="absolute bottom-24 left-0 right-0 max-h-[70vh] overflow-y-auto pointer-events-auto z-25 bg-background/95 backdrop-blur-md border-t border-border">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
              Trophies
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Leaderboard */}
        <section>
          <h3 className="text-xs font-mono text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Medal className="w-3.5 h-3.5" />
            Leaderboard
          </h3>
          <GlassPanel className="p-0 overflow-hidden" variant="strong">
            <ul className="divide-y divide-border/60">
              {leaderboard.map((row) => (
                <li
                  key={row.name}
                  className={`flex items-center gap-3 px-3 py-2 ${
                    row.isCurrentUser ? "bg-primary/10 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <span className="w-6 text-[10px] font-mono text-muted-foreground font-bold">
                    #{row.rank}
                  </span>
                  <span className="flex-1 text-xs font-mono text-foreground truncate">
                    {row.name}
                    {row.isCurrentUser && (
                      <span className="ml-1.5 text-[10px] text-primary">(you)</span>
                    )}
                  </span>
                  <span className="text-[10px] font-mono text-primary font-medium">
                    {row.xp.toLocaleString()} XP
                  </span>
                </li>
              ))}
            </ul>
          </GlassPanel>
        </section>

        {/* Characters you've worked with */}
        <section>
          <h3 className="text-xs font-mono text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Characters you&apos;ve worked with
          </h3>
          {charactersWorkedWith.length === 0 ? (
            <GlassPanel className="p-4 text-center" variant="strong">
              <p className="text-[10px] font-mono text-muted-foreground">
                Complete tasks at locations to meet characters.
              </p>
            </GlassPanel>
          ) : (
            <div className="flex flex-wrap gap-3">
              {charactersWorkedWith.map((npc) => (
                <GlassPanel
                  key={npc.id}
                  className="flex items-center gap-2 p-2 min-w-0"
                  variant="strong"
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                    {npc.character?.imageUrl ? (
                      <Image
                        src={npc.character.imageUrl}
                        alt=""
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-mono text-primary bg-primary/20">
                        {npc.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-mono font-medium text-foreground truncate">
                    {npc.name}
                  </span>
                </GlassPanel>
              ))}
            </div>
          )}
        </section>

        {/* Completed tasks (with character) */}
        <section>
          <h3 className="text-xs font-mono text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed tasks
          </h3>
          {tasksByNewest.length === 0 ? (
            <GlassPanel className="p-4 text-center" variant="strong">
              <p className="text-[10px] font-mono text-muted-foreground">
                Your completed tasks will appear here.
              </p>
            </GlassPanel>
          ) : (
            <ul className="space-y-2">
              {tasksByNewest.map((task) => {
                const npc = npcs.find((n) => n.id === task.characterId)
                return (
                  <li key={task.id}>
                    <GlassPanel className="p-3" variant="strong">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                          {npc?.character?.imageUrl ? (
                            <Image
                              src={npc.character.imageUrl}
                              alt=""
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-mono text-primary bg-primary/20">
                              {task.characterName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-foreground font-medium leading-tight">
                            {task.taskTitle}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                            {typeLabel[task.type] ?? task.type} · {task.characterName} · {task.placeName} · {formatCompletedAt(task.completedAt)}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-primary flex-shrink-0">
                          +{task.xpEarned} XP
                        </span>
                      </div>
                    </GlassPanel>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Badges - compact */}
        <section>
          <h3 className="text-xs font-mono text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            Badges
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { name: "First Shot", icon: "📷", done: completedTasks.some((t) => t.type === "photo") },
              { name: "Survey Scout", icon: "📋", done: completedTasks.filter((t) => t.type === "yes_no").length >= 3 },
              { name: "Explorer", icon: "🗺", done: new Set(completedTasks.map((t) => t.placeId)).size >= 3 },
              { name: "Task Runner", icon: "🏆", done: completedTasks.length >= 5 },
            ].map((badge) => (
              <GlassPanel
                key={badge.name}
                className={`p-2 text-center ${badge.done ? "border-primary/50 bg-primary/5" : "opacity-60"}`}
                variant="strong"
              >
                <span className="text-base leading-none">{badge.icon}</span>
                <p className="text-[9px] font-mono text-foreground mt-1 leading-tight">
                  {badge.name}
                </p>
              </GlassPanel>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
