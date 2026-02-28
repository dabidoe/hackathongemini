"use client"

import { useState, useRef, useCallback } from "react"
import { User, Sparkles, RefreshCw, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ProfileChips, type SelectedChips } from "./profile-chips"

interface ProfileTabProps {
  playerStats: {
    level: number
    xp: number
    maxXp: number
    questsCompleted: number
    milesWalked: number
    streak: number
  }
  onClose?: () => void
}

export function ProfileTab({ playerStats, onClose }: ProfileTabProps) {
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [selectedChips, setSelectedChips] = useState<SelectedChips>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const displayImageUrl = generatedImageUrl ?? sourceImageUrl

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return
      setIsUploading(true)
      setGenerateError(null)
      try {
        const formData = new FormData()
        formData.append("image", file)
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setGenerateError(data?.error ?? "Upload failed")
          return
        }
        if (data?.url) {
          setSourceImageUrl(data.url)
          setGeneratedImageUrl(null)
        }
      } catch {
        setGenerateError("Upload failed")
      } finally {
        setIsUploading(false)
      }
    },
    []
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      e.target.value = ""
    },
    [handleFile]
  )

  const handleRegenerate = async () => {
    if (!sourceImageUrl) return
    setIsGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch("/api/generate-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: sourceImageUrl,
          chips: selectedChips,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setGenerateError(data?.error ?? data?.message ?? "Failed to generate")
        return
      }
      if (data?.imageUrl) setGeneratedImageUrl(data.imageUrl)
    } catch {
      setGenerateError("Connection error")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="absolute bottom-24 left-0 right-0 max-h-[85vh] min-h-[70vh] overflow-y-auto pointer-events-auto z-25 bg-background/70 backdrop-blur-sm border-t border-border">
      <div className="flex flex-col items-center gap-6 p-6">
        <div className="flex items-center justify-between w-full max-w-2xl">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary flex-shrink-0" />
            <h2 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
              Your Character
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

        {/* Avatar + chips: stacked on mobile, side-by-side on larger screens */}
        <div className="w-full max-w-2xl flex flex-col md:flex-row gap-6 items-start">
          {/* Clickable upload container */}
          <button
            type="button"
            onClick={() => !isUploading && fileInputRef.current?.click()}
            disabled={isUploading}
            className={`flex-shrink-0 w-full max-w-[240px] md:w-48 aspect-[3/4] rounded-lg overflow-hidden border-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              isDragging ? "border-primary bg-primary/10" : "border-primary/60 bg-muted/40 hover:border-primary/80 hover:bg-muted/60"
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {displayImageUrl ? (
              <Image
                src={displayImageUrl}
                alt="Profile"
                width={320}
                height={427}
                className="w-full h-full object-cover"
                unoptimized={
                  displayImageUrl.startsWith("blob:") || displayImageUrl.includes("picsum")
                }
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <Upload className="w-10 h-10 text-muted-foreground/50 mb-2" />
                <p className="text-xs font-mono text-muted-foreground leading-tight">
                  {isUploading ? "Uploading..." : "Tap to upload"}
                </p>
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Chips - right side on larger screens */}
          <div className="flex-1 w-full md:min-w-0 space-y-4 p-4 rounded-lg border-2 border-primary/50 bg-background/60 backdrop-blur-sm">
            <ProfileChips chips={selectedChips} onChange={setSelectedChips} />
            <Button
              size="sm"
              className="w-full h-8 font-mono text-[10px] bg-primary/20 border border-primary text-primary hover:bg-primary/30"
              onClick={handleRegenerate}
              disabled={isGenerating || !sourceImageUrl}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>

        {generateError && (
          <p className="text-xs text-destructive font-mono w-full max-w-xs text-center">
            {generateError}
          </p>
        )}

        {/* Stats */}
        <div className="w-full max-w-xs p-3 rounded-lg bg-background/60 border-2 border-primary/40">
          <h4 className="text-xs font-mono uppercase tracking-wider text-foreground mb-2">
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

        <p className="text-[9px] font-mono text-foreground/90 text-center pb-2">
          AI_GENERATED // NANO_BANANA
        </p>
      </div>
    </div>
  )
}
