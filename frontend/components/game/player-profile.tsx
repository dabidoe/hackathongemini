"use client"

import { useState } from "react"
import { X, Sparkles, User, RefreshCw } from "lucide-react"
import { GlassPanel } from "./glass-panel"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"

interface PlayerProfileProps {
  isOpen: boolean
  onClose: () => void
  playerStats: {
    level: number
    xp: number
    maxXp: number
    questsCompleted: number
    milesWalked: number
    streak: number
  }
}

export function PlayerProfile({ isOpen, onClose, playerStats }: PlayerProfileProps) {
  const [characterDescription, setCharacterDescription] = useState("")
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateCharacterImage = async () => {
    if (!characterDescription.trim()) return
    
    setIsGenerating(true)
    
    const prompt = `Portrait of ${characterDescription}, cyberpunk style, cinematic lighting, highly detailed, orange and black color scheme, historical urban aesthetic, character portrait for a game`

    try {
      const response = await fetch("/api/generate-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, description: characterDescription })
      })

      const data = await response.json()
      
      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl)
      }
    } catch (error) {
      console.error("Failed to generate image:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md pointer-events-auto">
      <GlassPanel 
        className="w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
        variant="strong"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Create Your Character</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Description Text Box */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Describe Your Character
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Describe your character's appearance, personality, and style. Be as detailed as you like - include hair, eyes, clothing, accessories, mood, and background.
            </p>
            <Textarea
              value={characterDescription}
              onChange={(e) => setCharacterDescription(e.target.value)}
              className="min-h-[120px] text-sm font-mono bg-muted/50 border-border resize-none"
              placeholder="A mysterious street runner with short silver hair, amber cybernetic eyes, wearing a weathered leather jacket with glowing orange circuitry. They have a determined expression and subtle scars across their left cheek..."
            />
          </div>

          {/* Generate Button */}
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

          {/* Character Preview */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Character Preview
            </label>
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted/30 border border-border flex items-center justify-center">
              {generatedImageUrl ? (
                <Image
                  src={generatedImageUrl}
                  alt="Generated character"
                  width={300}
                  height={400}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6">
                  <User className="w-16 h-16 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-xs font-mono text-muted-foreground">
                    No character generated yet
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">
                    Describe your character above and generate
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Player Stats */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
              Your Stats
            </h4>
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
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border shrink-0">
          <p className="text-[9px] font-mono text-muted-foreground text-center">
            AI_GENERATED // NANO_BANANA
          </p>
        </div>
      </GlassPanel>
    </div>
  )
}
