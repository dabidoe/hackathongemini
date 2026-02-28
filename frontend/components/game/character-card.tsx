"use client"

import { useState, useEffect, useRef } from "react"
import { X, Heart, Star, MapPin, Clock, Sparkles, Send, MessageSquare, User, Target } from "lucide-react"
import { GlassPanel } from "./glass-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

type CardTab = "task" | "profile"

interface Character {
  id: string
  name: string
  title: string
  description: string
  personality: string[]
  trustLevel: number
  questsCompleted: number
  xpReward?: number
  lastSeen?: string
  imageUrl?: string
  backstory: string
}

interface ChatMessage {
  id: string
  sender: "npc" | "player"
  text: string
}

interface CharacterCardProps {
  isOpen: boolean
  onClose: () => void
  character: Character
  initialMessage?: string
  onStartQuest?: () => void
  onSendMessage?: (message: string) => void
  isTyping?: boolean
  chatMessages?: ChatMessage[]
}

export function CharacterCard({
  isOpen,
  onClose,
  character,
  initialMessage,
  onStartQuest,
  onSendMessage,
  isTyping = false,
  chatMessages = []
}: CharacterCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [activeTab, setActiveTab] = useState<CardTab>("task")
  const [inputValue, setInputValue] = useState("")
  const [displayedText, setDisplayedText] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const [isQuestActive, setIsQuestActive] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Typewriter effect for initial message
  useEffect(() => {
    if (!isOpen || !initialMessage) return
    
    setIsAnimating(true)
    setDisplayedText("")
    
    let charIndex = 0
    const interval = setInterval(() => {
      if (charIndex < initialMessage.length) {
        setDisplayedText(initialMessage.slice(0, charIndex + 1))
        charIndex++
      } else {
        setIsAnimating(false)
        clearInterval(interval)
      }
    }, 25)

    return () => clearInterval(interval)
  }, [isOpen, initialMessage])

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, displayedText])

  const handleSendMessage = () => {
    if (!inputValue.trim() || isTyping) return
    onSendMessage?.(inputValue.trim())
    setInputValue("")
  }

  if (!isOpen) return null

  const trustColor = character.trustLevel >= 70 
    ? 'text-neon-green' 
    : character.trustLevel >= 40 
      ? 'text-primary' 
      : 'text-muted-foreground'

  const trustBgColor = character.trustLevel >= 70 
    ? 'bg-neon-green' 
    : character.trustLevel >= 40 
      ? 'bg-primary' 
      : 'bg-muted-foreground'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md pointer-events-auto">
      <GlassPanel 
        className="w-full max-w-sm animate-in zoom-in-95 fade-in duration-300 overflow-hidden"
        variant="strong"
        glowColor="cyan"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-background/50 hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Character Portrait */}
        <div className="relative h-48 w-full overflow-hidden">
          {/* Placeholder/Loading State or Fallback */}
          {(!imageLoaded || imageError) && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center">
              <div className="text-center">
                <div className={`w-20 h-20 mx-auto rounded-full border-2 border-primary/50 flex items-center justify-center bg-background/50 ${!imageError ? 'animate-pulse' : ''}`}>
                  <span className="text-3xl font-mono font-bold text-primary">
                    {character.name.charAt(0)}
                  </span>
                </div>
                {!imageError && (
                  <div className="mt-2 flex items-center justify-center gap-1 text-muted-foreground">
                    <Sparkles className="w-3 h-3 animate-spin" />
                    <span className="text-[10px] font-mono">Loading portrait...</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* AI Generated Portrait */}
          {character.imageUrl && !imageError && (
            <Image
              src={character.imageUrl}
              alt={`Portrait of ${character.name}`}
              fill
              className={`object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {/* Character Level Badge */}
          <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-accent/80 backdrop-blur-sm">
            <span className="text-[10px] font-mono text-accent-foreground font-bold uppercase">
              NPC
            </span>
          </div>
        </div>

        {/* Header with Name & Title */}
        <div className="p-4 -mt-8 relative">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-lg font-mono font-bold text-foreground flex items-center gap-2">
                {character.name}
                <Sparkles className="w-3 h-3 text-accent" />
              </h2>
              <p className="text-[10px] font-mono text-primary uppercase tracking-wider">
                {character.title}
              </p>
            </div>
            {/* XP Badge */}
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-primary/20 border border-primary/30">
              <Star className="w-3 h-3 text-primary" />
              <span className="text-xs font-mono font-bold text-primary">
                +{character.xpReward || 50} XP
              </span>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 mb-3 p-1 bg-muted/30 rounded-lg">
            <button
              onClick={() => setActiveTab("task")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                activeTab === "task"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Target className="w-3 h-3" />
              Task
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                activeTab === "profile"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-3 h-3" />
              Profile
            </button>
          </div>

          {/* Task Tab Content */}
          {activeTab === "task" && (
            <div className="space-y-3">
              {/* Chat Area - Primary Focus */}
              <div 
                ref={chatContainerRef}
                className="p-3 rounded-lg bg-muted/30 border border-border max-h-40 overflow-y-auto"
              >
                {/* Initial NPC message with typewriter effect */}
                {(displayedText || chatMessages.length === 0) && (
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div className="text-xs font-mono text-foreground/90 leading-relaxed">
                      {displayedText}
                      {isAnimating && (
                        <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-pulse" />
                      )}
                    </div>
                  </div>
                )}

                {/* Chat history */}
                {chatMessages.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {chatMessages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex ${msg.sender === 'player' ? 'justify-end' : 'items-start gap-2'}`}
                      >
                        {msg.sender === 'npc' && (
                          <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        )}
                        <div className={`max-w-[85%] px-2 py-1 rounded text-xs font-mono ${
                          msg.sender === 'player' 
                            ? 'bg-primary/20 text-primary' 
                            : 'text-foreground/90'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div className="flex gap-1 py-1">
                          <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 h-9 text-xs font-mono bg-muted/50 border-border"
                  disabled={isTyping || isAnimating}
                />
                <Button
                  size="icon"
                  className="h-9 w-9 bg-primary/20 border border-primary text-primary hover:bg-primary/30"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping || isAnimating}
                >
                  <Send className={`w-4 h-4 ${isTyping ? 'animate-pulse' : ''}`} />
                </Button>
              </div>

              {/* Quest Button - lights up neon green and shows Active when started */}
              <Button
                onClick={() => {
                  if (!isQuestActive) {
                    setIsQuestActive(true)
                    onStartQuest?.()
                  }
                }}
                className={`w-full h-10 font-mono text-xs transition-all duration-300 ${
                  isQuestActive
                    ? "bg-neon-green/25 border-neon-green text-neon-green shadow-[0_0_12px_var(--neon-green)] hover:bg-neon-green/30"
                    : "bg-primary/20 border border-primary text-primary hover:bg-primary/30"
                }`}
              >
                <Star className={`w-4 h-4 mr-2 ${isQuestActive ? "fill-neon-green" : ""}`} />
                {isQuestActive ? "Active" : "Start Quest"}
              </Button>
            </div>
          )}

          {/* Profile Tab Content */}
          {activeTab === "profile" && (
            <div className="space-y-3">
              {/* Stats Row */}
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <Heart className={`w-3 h-3 ${trustColor}`} />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Trust Level</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${trustBgColor}`}
                      style={{ width: `${character.trustLevel}%` }}
                    />
                  </div>
                </div>
                <div className="text-center px-3 border-l border-border">
                  <div className="flex items-center gap-1 justify-center">
                    <Star className="w-3 h-3 text-accent" />
                    <span className="text-sm font-mono font-bold text-foreground">
                      {character.questsCompleted}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground uppercase">
                    Quests
                  </span>
                </div>
              </div>

              {/* Personality Tags */}
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase mb-1.5 block">Traits</span>
                <div className="flex flex-wrap gap-1.5">
                  {character.personality.map((trait, index) => (
                    <span 
                      key={index}
                      className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-muted text-muted-foreground border border-border"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              {/* Backstory */}
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase mb-1.5 block">Backstory</span>
                <p className="text-xs font-mono text-foreground/80 leading-relaxed">
                  {character.backstory}
                </p>
              </div>

              {/* Last Seen */}
              {character.lastSeen && (
                <div className="flex items-center gap-2 text-muted-foreground pt-2 border-t border-border">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[10px] font-mono">Last seen: {character.lastSeen}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Status */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="text-[9px] font-mono">Available Now</span>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground animate-flicker">
            AI_GENERATED//NANO_BANANA
          </span>
        </div>
      </GlassPanel>
    </div>
  )
}
