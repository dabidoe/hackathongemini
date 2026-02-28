"use client"

import { useState } from "react"
import { User, Sparkles, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"

interface ProfileTabProps {
  playerStats: {
    level: number
    xp: number
    maxXp: number
    questsCompleted: number
    milesWalked: number
    streak: number
  }
}

export function ProfileTab({ playerStats }: ProfileTabProps) {
  const [characterDescription, setCharacterDescription] = useState("")
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const generateCharacterImage = async () => {
    if (!characterDescription.trim()) return
    setIsGenerating(true)
    setGenerateError(null)
    const prompt = `Portrait of ${characterDescription}, cyberpunk style, cinematic lighting, highly detailed, orange and black color scheme, historical urban aesthetic, character portrait for a game`
    try {
      const response = await fetch("/api/generate-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, description: characterDescription }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setGenerateError(data?.error ?? data?.message ?? "Failed to generate. Try again.")
        return
      }
      if (data?.imageUrl) setGeneratedImageUrl(data.imageUrl)
    } catch (error) {
      console.error("Failed to generate image:", error)
      setGenerateError("Connection error. Try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="absolute bottom-24 left-0 right-0 max-h-[60vh] overflow-y-auto pointer-events-auto z-25 bg-background/95 backdrop-blur-md border-t border-border">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Your Character</h2>
        </div>

        {/* Your Stats */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Your Stats</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-primary">{playerStats.level}</div>
              <div className="text-[9px] font-mono text-muted-foreground uppercase">Level</div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{playerStats.questsCompleted}</div>
              <div className="text-[9px] font-mono text-muted-foreground uppercase">Quests</div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{playerStats.streak}</div>
              <div className="text-[9px] font-mono text-muted-foreground uppercase">Streak</div>
            </div>
          </div>
        </div>

        {/* Describe Your Character */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Describe Your Character
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Include hair, eyes, clothing, accessories, mood, and background.
          </p>
          <Textarea
            value={characterDescription}
            onChange={(e) => setCharacterDescription(e.target.value)}
            className="min-h-[100px] text-sm font-mono bg-muted/50 border-border resize-none text-muted-foreground placeholder:text-muted-foreground/60"
            placeholder="A mysterious street runner with short silver hair, amber cybernetic eyes..."
            disabled={isGenerating}
          />
        </div>

        <Button
          onClick={generateCharacterImage}
          disabled={isGenerating || !characterDescription.trim()}
          className="w-full h-10 font-mono text-xs bg-primary/20 border border-primary text-primary hover:bg-primary/30 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Character Portrait
            </>
          )}
        </Button>
        {generateError && (
          <p className="text-xs text-destructive font-mono">{generateError}</p>
        )}

        {/* Character Preview */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Character Preview
          </label>
          <div className="aspect-[3/4] max-h-48 rounded-lg overflow-hidden bg-muted/30 border border-border flex items-center justify-center">
            {generatedImageUrl ? (
              <Image
                src={generatedImageUrl}
                alt="Generated character"
                width={300}
                height={400}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-[10px] font-mono text-muted-foreground">No character generated yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Preferences</h4>
          <div className="space-y-2">
            <label className="flex items-center justify-between gap-2 text-xs font-mono text-foreground">
              <span>Sound effects</span>
              <input type="checkbox" defaultChecked className="rounded border-border bg-muted/50 text-primary" />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs font-mono text-foreground">
              <span>Quest notifications</span>
              <input type="checkbox" defaultChecked className="rounded border-border bg-muted/50 text-primary" />
            </label>
          </div>
        </div>

        <p className="text-[9px] font-mono text-muted-foreground text-center pb-2">
          AI_GENERATED // NANO_BANANA
        </p>
      </div>
    </div>
  )
}
