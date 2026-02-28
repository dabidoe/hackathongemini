"use client"

import { useState, useCallback, useEffect } from "react"

export interface PlayerStats {
  xp: number
  maxXp: number
  level: number
  streak: number
  milesWalked: number
  blockProgress: number
  areaName: string
}

export interface ChatMessage {
  id: string
  sender: "npc" | "player"
  text: string
  timestamp: Date
}

export interface MicroQuest {
  id: string
  type: "photo" | "yes_no" | "confirm" | "location"
  title: string
  description: string
  question?: string
  hint?: string
  reward: { xp: number; blockProgress?: number }
}

export interface SelectedNPC {
  npcId: string
  placeId: string
  name: string
  archetype: string
  placeName: string
  lat: number
  lng: number
  trustLevel: number
  mood: "neutral" | "happy" | "mysterious" | "urgent"
  imageUrl?: string
}

export interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
  lastResult: {
    verdict: "approved" | "rejected" | "needs_review"
    xpAwarded: number
    blockDelta: number
    npcReactionText: string
  } | null
}

export function useGameState() {
  // Core state
  const [selectedNPC, setSelectedNPC] = useState<SelectedNPC | null>(null)
  const [activeQuest, setActiveQuest] = useState<MicroQuest | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    xp: 1850,
    maxXp: 2500,
    level: 12,
    streak: 7,
    milesWalked: 3.2,
    blockProgress: 67,
    areaName: "Neon District"
  })
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    lastResult: null
  })
  const [isNPCTyping, setIsNPCTyping] = useState(false)

  // Listen for NPC selection events from Leaflet map
  useEffect(() => {
    const handleNPCSelected = (event: CustomEvent<SelectedNPC>) => {
      const npcPayload = event.detail
      setSelectedNPC(npcPayload)
      setChatMessages([]) // Reset chat for new NPC
    }

    window.addEventListener("npc:selected", handleNPCSelected as EventListener)
    
    return () => {
      window.removeEventListener("npc:selected", handleNPCSelected as EventListener)
    }
  }, [])

  // Send message to NPC via API
  const sendMessageToNPC = useCallback(async (message: string) => {
    if (!selectedNPC) return

    // Add player message to chat
    const playerMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "player",
      text: message,
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, playerMessage])
    setIsNPCTyping(true)

    try {
      const response = await fetch("/api/npc/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcId: selectedNPC.npcId,
          placeId: selectedNPC.placeId,
          userText: message,
          currentNPCState: {
            trustLevel: selectedNPC.trustLevel,
            questsCompleted: 0
          }
        })
      })

      if (!response.ok) throw new Error("Failed to send message")

      const data = await response.json()
      
      // Add NPC response to chat
      const npcMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "npc",
        text: data.npcReply,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, npcMessage])

      // Update trust level if changed
      if (data.updatedTrust !== selectedNPC.trustLevel) {
        setSelectedNPC(prev => prev ? { ...prev, trustLevel: data.updatedTrust } : null)
      }

      // Handle new quest if provided
      if (data.updatedQuest) {
        setActiveQuest({
          id: data.updatedQuest.id,
          type: data.updatedQuest.type,
          title: data.updatedQuest.title,
          description: data.updatedQuest.description,
          reward: { xp: 15, blockProgress: 2 }
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "npc",
        text: "...[connection unstable]... Try again.",
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsNPCTyping(false)
    }
  }, [selectedNPC])

  // Submit quest completion
  const submitQuest = useCallback(async (
    questId: string,
    placeId: string,
    photoUrl?: string,
    answers?: { questionId: string; answer: string | boolean }[]
  ) => {
    setUploadState(prev => ({ ...prev, isUploading: true, progress: 0, error: null }))

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadState(prev => ({
        ...prev,
        progress: Math.min(90, prev.progress + 10)
      }))
    }, 200)

    try {
      const response = await fetch("/api/quest/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId,
          placeId,
          photoUrl,
          answers
        })
      })

      clearInterval(progressInterval)
      setUploadState(prev => ({ ...prev, progress: 100 }))

      if (!response.ok) throw new Error("Failed to submit quest")

      const data = await response.json()

      // Update player stats if approved
      if (data.verdict === "approved") {
        setPlayerStats(prev => ({
          ...prev,
          xp: prev.xp + data.xpAwarded,
          blockProgress: Math.min(100, prev.blockProgress + data.blockDelta)
        }))
      }

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        lastResult: data
      }))

      // Emit quest completion event to map
      window.dispatchEvent(new CustomEvent("quest:completed", {
        detail: {
          placeId,
          questId,
          status: data.verdict,
          xpAwarded: data.xpAwarded,
          blockDelta: data.blockDelta
        }
      }))

      return data
    } catch (error) {
      clearInterval(progressInterval)
      console.error("Error submitting quest:", error)
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: "Submission failed. Please try again."
      }))
      throw error
    }
  }, [])

  // Clear selected NPC
  const clearSelectedNPC = useCallback(() => {
    setSelectedNPC(null)
    setActiveQuest(null)
    setChatMessages([])
  }, [])

  // Reset upload state
  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      lastResult: null
    })
  }, [])

  return {
    // State
    selectedNPC,
    activeQuest,
    chatMessages,
    playerStats,
    uploadState,
    isNPCTyping,
    
    // Actions
    setSelectedNPC,
    setActiveQuest,
    sendMessageToNPC,
    submitQuest,
    clearSelectedNPC,
    resetUploadState,
    setPlayerStats
  }
}
