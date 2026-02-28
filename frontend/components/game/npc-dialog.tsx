"use client"

import { useState, useEffect, useRef } from "react"
import { X, MessageSquare, Sparkles, ChevronRight, Send, Heart } from "lucide-react"
import { GlassPanel } from "./glass-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DialogOption {
  id: string
  text: string
  action?: "accept_quest" | "decline" | "more_info" | "custom" | "micro_quest"
}

interface ChatMessage {
  id: string
  sender: "npc" | "player"
  text: string
  timestamp?: Date
}

interface NPCDialogProps {
  isOpen: boolean
  onClose: () => void
  npc: {
    name: string
    title: string
    avatarInitial: string
    mood: "neutral" | "happy" | "mysterious" | "urgent"
    trustLevel?: number
  }
  messages: string[]
  options: DialogOption[]
  onOptionSelect: (option: DialogOption) => void
  onSendMessage?: (message: string) => void
  isTyping?: boolean
  showChatInput?: boolean
}

export function NPCDialog({ 
  isOpen, 
  onClose, 
  npc, 
  messages, 
  options, 
  onOptionSelect,
  onSendMessage,
  isTyping = false,
  showChatInput = false
}: NPCDialogProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const moodColors = {
    neutral: "text-primary border-primary",
    happy: "text-neon-green border-neon-green",
    mysterious: "text-accent border-accent",
    urgent: "text-destructive border-destructive"
  }

  const trustLevel = npc.trustLevel ?? 50

  // Typewriter effect
  useEffect(() => {
    if (!isOpen || messages.length === 0) return
    
    const currentMessage = messages[currentMessageIndex]
    if (!currentMessage) return

    setIsAnimating(true)
    setDisplayedText("")
    
    let charIndex = 0
    const interval = setInterval(() => {
      if (charIndex < currentMessage.length) {
        setDisplayedText(currentMessage.slice(0, charIndex + 1))
        charIndex++
      } else {
        setIsAnimating(false)
        clearInterval(interval)
      }
    }, 30)

    return () => clearInterval(interval)
  }, [isOpen, messages, currentMessageIndex])

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentMessageIndex(0)
      setChatHistory([])
      setInputValue("")
    }
  }, [isOpen])

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatHistory])

  if (!isOpen) return null

  const handleTapToContinue = () => {
    if (isAnimating) {
      setDisplayedText(messages[currentMessageIndex])
      setIsAnimating(false)
    } else if (currentMessageIndex < messages.length - 1) {
      setCurrentMessageIndex(prev => prev + 1)
    }
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return
    
    const playerMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "player",
      text: inputValue.trim(),
      timestamp: new Date()
    }
    setChatHistory(prev => [...prev, playerMessage])
    onSendMessage?.(inputValue.trim())
    setInputValue("")
  }

  const showOptions = !isAnimating && currentMessageIndex === messages.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-end p-0 md:p-4 bg-background/40 backdrop-blur-sm pointer-events-auto">
      <GlassPanel 
        className="w-full md:w-96 md:max-w-md md:max-h-[80vh] animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-300 rounded-t-2xl md:rounded-lg flex flex-col max-h-[85vh]"
        variant="strong"
        glowColor="cyan"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg border-2 ${moodColors[npc.mood]} bg-background/50 flex items-center justify-center`}>
              <span className={`text-lg font-mono font-bold ${moodColors[npc.mood].split(' ')[0]}`}>
                {npc.avatarInitial}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-mono text-foreground font-medium flex items-center gap-1.5">
                {npc.name}
                <Sparkles className="w-3 h-3 text-accent" />
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                {npc.title}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Trust Meter */}
        <div className="px-3 py-2 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Heart className={`w-3.5 h-3.5 ${trustLevel >= 70 ? 'text-accent fill-accent' : trustLevel >= 40 ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-mono text-muted-foreground uppercase">Trust Level</span>
                <span className="text-[9px] font-mono text-foreground">{trustLevel}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    trustLevel >= 70 ? 'bg-accent' : trustLevel >= 40 ? 'bg-primary' : 'bg-muted-foreground'
                  }`}
                  style={{ width: `${trustLevel}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dialog Content / Chat Thread */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto min-h-[150px] max-h-[300px]"
        >
          {/* Initial Messages */}
          <div 
            className="p-4 cursor-pointer"
            onClick={handleTapToContinue}
          >
            <div className="flex gap-2">
              <MessageSquare className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-mono text-foreground/90 leading-relaxed">
                  {displayedText}
                  {isAnimating && (
                    <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-pulse" />
                  )}
                </p>
                {!showOptions && !isAnimating && (
                  <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                    <span className="text-[10px] font-mono">Tap to continue</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat History */}
          {(chatHistory.length > 0 || isTyping) && (
            <div className="px-4 pb-2 space-y-2">
              {chatHistory.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.sender === 'player' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs font-mono ${
                    msg.sender === 'player' 
                      ? 'bg-primary/20 text-primary border border-primary/30' 
                      : 'bg-muted text-foreground'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {/* Typing indicator in chat */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted px-3 py-2 rounded-lg">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Response Options */}
        {showOptions && !showChatInput && (
          <div className="p-3 pt-0 space-y-2 shrink-0">
            {isTyping ? (
              <div className="flex items-center gap-2 p-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-mono text-muted-foreground">AI is thinking...</span>
              </div>
            ) : (
              options.map((option) => (
                <Button
                  key={option.id}
                  variant={option.action === "accept_quest" ? "default" : "outline"}
                  className={`w-full justify-start font-mono text-xs h-9 ${
                    option.action === "accept_quest" 
                      ? "bg-primary/20 border-primary text-primary hover:bg-primary/30" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => onOptionSelect(option)}
                >
                  <ChevronRight className="w-3 h-3 mr-2" />
                  {option.text}
                </Button>
              ))
            )}
          </div>
        )}

        {/* Chat Input - Always visible when showChatInput is true */}
        {showChatInput && (
          <div className="p-3 border-t border-border shrink-0">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 h-9 text-xs font-mono bg-muted/50 border-border"
                disabled={isTyping}
              />
              <Button
                size="icon"
                className="h-9 w-9 bg-primary/20 border border-primary text-primary hover:bg-primary/30"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
              >
                <Send className={`w-4 h-4 ${isTyping ? 'animate-pulse' : ''}`} />
              </Button>
            </div>
          </div>
        )}

        {/* Status Line */}
        <div className="px-3 py-2 border-t border-border flex items-center justify-between shrink-0">
          <span className="text-[10px] font-mono text-muted-foreground">
            CONNECTION: <span className="text-neon-green">STABLE</span>
          </span>
          <span className="text-[10px] font-mono text-muted-foreground animate-flicker">
            NEURAL_LINK//ACTIVE
          </span>
        </div>
      </GlassPanel>
    </div>
  )
}
