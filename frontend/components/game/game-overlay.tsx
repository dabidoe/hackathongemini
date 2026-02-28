"use client"

import { useState, useCallback, useEffect } from "react"
import { Zap, Camera, Check, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StatusBar } from "./status-bar"
import { QuestTracker, Quest } from "./quest-tracker"
import { ActionBar } from "./action-bar"
import { NPCDialog } from "./npc-dialog"
import { PhotoProof } from "./photo-proof"
import { NotificationStack } from "./notification-toast"
import { MapMarker } from "./map-marker"
import { RewardAnimation } from "./reward-animation"
import { LocationDisplay } from "./location-display"
import { NPCCardStrip } from "./npc-card-strip"
import { CharacterCard } from "./character-card"
import { ProfileTab } from "./profile-tab"
import { TrophiesTab } from "./trophies-tab"

// Leaflet integration event payload type
interface LeafletNPCPayload {
  npcId: string
  placeId: string
  name: string
  archetype: string
  placeName: string
  lat: number
  lng: number
}

interface Notification {
  id: string
  type: "success" | "warning" | "info" | "achievement"
  title: string
  message?: string
  duration?: number
}

interface Character {
  id: string
  name: string
  title: string
  description: string
  personality: string[]
  trustLevel: number
  questsCompleted: number
  lastSeen?: string
  imageUrl?: string
  backstory: string
}

interface NPC {
  id: string
  name: string
  title: string
  avatarInitial: string
  mood: "neutral" | "happy" | "mysterious" | "urgent"
  trustLevel?: number
  position: { x: number; y: number }
  character?: Character
  quest?: Quest
  microQuest?: {
    id: string
    type: "photo" | "yes_no" | "description" | "confirm" | "location"
    title: string
    description: string
    question?: string
    hint?: string
    reward: { xp: number; blockProgress?: number }
  }
}

interface GameOverlayProps {
  onMarkerTap?: (markerId: string) => void
}

export function GameOverlay({ onMarkerTap }: GameOverlayProps) {
  const [activeTab, setActiveTab] = useState<"map" | "quests" | "profile" | "achievements">("map")
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null)
  const [showNPCDialog, setShowNPCDialog] = useState(false)
  const [showPhotoProof, setShowPhotoProof] = useState(false)
  const [showReward, setShowReward] = useState(false)
  const [showCharacterCard, setShowCharacterCard] = useState(false)
  const [showLocationScreen, setShowLocationScreen] = useState(false)
  const [currentReward, setCurrentReward] = useState<{ xp: number; blockProgress?: number; message?: string; type?: "success" | "achievement" | "level_up" } | null>(null)
  
  // Demo location data for the selected NPC's location
  const [currentLocation] = useState({
    id: "loc1",
    name: "Neon District Hub",
    type: "Historic Landmark",
    imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80",
    distance: 150,
    visitorsToday: 47,
    lastVisited: "2h ago"
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null)
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: "npc" | "player"; text: string }[]>([])
  const [isNPCTyping, setIsNPCTyping] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeQuestNpcId, setActiveQuestNpcId] = useState<string | null>(null)
  const [expandedQuestNpcId, setExpandedQuestNpcId] = useState<string | null>(null)
  const [questPanelYesNo, setQuestPanelYesNo] = useState<Record<string, boolean | null>>({})
  const [questPanelDescription, setQuestPanelDescription] = useState<Record<string, string>>({})
  
  // Player stats
  const [playerStats, setPlayerStats] = useState({
    xp: 1850,
    maxXp: 2500,
    level: 12,
    streak: 7,
    questsCompleted: 23,
    milesWalked: 3.2,
    blockProgress: 67,
    areaName: "Neon District"
  })

  // Listen for NPC selection events from Leaflet map or NPC card strip
  useEffect(() => {
    const handleNPCSelected = (event: Event) => {
      const customEvent = event as CustomEvent<LeafletNPCPayload>
      const payload = customEvent.detail
      
      // Find matching NPC from our demo data or create one from payload
      const matchedNPC = npcs.find(npc => npc.id === payload.npcId)
      if (matchedNPC) {
        setSelectedNPC(matchedNPC)
        setShowCharacterCard(true)
        setChatMessages([])
      }
    }

    const handleNPCCardSelected = (event: Event) => {
      const customEvent = event as CustomEvent<{ npcId: string }>
      const { npcId } = customEvent.detail
      
      const matchedNPC = npcs.find(npc => npc.id === npcId)
      if (matchedNPC) {
        setSelectedNPC(matchedNPC)
        setShowCharacterCard(true)
        setChatMessages([])
      }
    }

    window.addEventListener("npc:selected", handleNPCSelected)
    window.addEventListener("npc:card:selected", handleNPCCardSelected)
    
    return () => {
      window.removeEventListener("npc:selected", handleNPCSelected)
      window.removeEventListener("npc:card:selected", handleNPCCardSelected)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Demo NPCs with micro-quests and character data
  const [npcs] = useState<NPC[]>([
    {
      id: "1",
      name: "ZERO",
      title: "Information Broker",
      avatarInitial: "Z",
      mood: "mysterious",
      trustLevel: 65,
      position: { x: 30, y: 40 },
      character: {
        id: "c1",
        name: "ZERO",
        title: "Information Broker",
        description: "Deals in secrets and encrypted data",
        personality: ["Mysterious", "Calculating", "Loyal"],
        trustLevel: 65,
        questsCompleted: 12,
        lastSeen: "Neon District, Block 7",
        imageUrl: "/characters/zero.jpg",
        backstory: "Once a corporate security analyst, ZERO went underground after discovering the truth about Project Nexus. Now operates as a freelance information broker, trading secrets to those who can afford discretion. They never reveal their true identity, always communicating through encrypted channels."
      },
      quest: {
        id: "q1",
        title: "Dead Drop Protocol",
        description: "Retrieve encrypted data from the abandoned server room",
        objectives: [
          { id: "o1", text: "Locate the server room entrance", completed: false },
          { id: "o2", text: "Photograph the data terminal", completed: false, requiresPhoto: true },
          { id: "o3", text: "Return to ZERO", completed: false }
        ],
        reward: { xp: 250, credits: 100 },
        npcName: "ZERO"
      },
      microQuest: {
        id: "mq1",
        type: "photo",
        title: "Storefront Scan",
        description: "Take a photo of the nearest storefront for the network database.",
        hint: "Make sure the store name is visible",
        reward: { xp: 15, blockProgress: 2 }
      }
    },
    {
      id: "2", 
      name: "NOVA",
      title: "Tech Scavenger",
      avatarInitial: "N",
      mood: "happy",
      trustLevel: 82,
      position: { x: 70, y: 60 },
      character: {
        id: "c2",
        name: "NOVA",
        title: "Tech Scavenger",
        description: "Salvages tech from the old world",
        personality: ["Energetic", "Optimistic", "Resourceful"],
        trustLevel: 82,
        questsCompleted: 28,
        lastSeen: "Scrap Yard, East Side",
        imageUrl: "/characters/nova.jpg",
        backstory: "NOVA grew up in the streets, learning to survive by salvaging and repurposing discarded tech. With an uncanny ability to fix anything, they've built a reputation as the go-to person for rare components. Always cheerful despite the harsh world around them."
      },
      microQuest: {
        id: "mq2",
        type: "yes_no",
        title: "Status Check",
        description: "Help verify current conditions in this area.",
        question: "Is this place currently open for business?",
        reward: { xp: 10, blockProgress: 3 }
      }
    },
    {
      id: "3",
      name: "CIPHER",
      title: "Accessibility Scout",
      avatarInitial: "C",
      mood: "neutral",
      trustLevel: 45,
      position: { x: 50, y: 25 },
      character: {
        id: "c3",
        name: "CIPHER",
        title: "Accessibility Scout",
        description: "Maps the city for those in need",
        personality: ["Quiet", "Observant", "Empathetic"],
        trustLevel: 45,
        questsCompleted: 8,
        lastSeen: "Central Hub, Level 2",
        imageUrl: "/characters/cipher.jpg",
        backstory: "After losing mobility in an accident, CIPHER dedicated their life to mapping accessibility routes throughout the city. They understand the importance of information others take for granted, and work tirelessly to ensure everyone can navigate the urban maze."
      },
      microQuest: {
        id: "mq3",
        type: "yes_no",
        title: "Access Report",
        description: "Help map accessibility features in the area.",
        question: "Is there a wheelchair ramp at this entrance?",
        reward: { xp: 12, blockProgress: 4 }
      }
    },
    {
      id: "4",
      name: "ECHO",
      title: "Street Historian",
      avatarInitial: "E",
      mood: "happy",
      trustLevel: 90,
      position: { x: 20, y: 70 },
      character: {
        id: "c4",
        name: "ECHO",
        title: "Street Historian",
        description: "Keeper of the city's memories",
        personality: ["Wise", "Storyteller", "Nostalgic"],
        trustLevel: 90,
        questsCompleted: 45,
        lastSeen: "Old Town Memorial",
        imageUrl: "/characters/echo.jpg",
        backstory: "ECHO remembers the city before the corporations took over. As one of the oldest runners in the network, they preserve stories of the past through oral tradition and hidden archives. Their knowledge of the city's history is unmatched, making them invaluable for locating forgotten places."
      },
      microQuest: {
        id: "mq4",
        type: "description",
        title: "Street Memory",
        description: "ECHO collects firsthand accounts of this area for the archive.",
        question: "What stands out to you about this place? Describe what you see or remember.",
        reward: { xp: 20, blockProgress: 5 }
      }
    }
  ])

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications(prev => [...prev, { ...notification, id }])
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const triggerReward = useCallback((reward: { xp: number; blockProgress?: number; message?: string; type?: "success" | "achievement" | "level_up" }) => {
    setCurrentReward(reward)
    setShowReward(true)
    
    // Update player stats
    setPlayerStats(prev => ({
      ...prev,
      xp: prev.xp + reward.xp,
      blockProgress: Math.min(100, prev.blockProgress + (reward.blockProgress || 0))
    }))
  }, [])

  const handleMarkerClick = (npc: NPC) => {
    setSelectedNPC(npc)
    // Show location screen with NPC cards when tapping a marker
    setShowLocationScreen(true)
    onMarkerTap?.(npc.id)
  }

  const handleNPCCardSelect = (npcId: string) => {
    const matchedNPC = npcs.find(npc => npc.id === npcId)
    if (matchedNPC) {
      setSelectedNPC(matchedNPC)
      setExpandedQuestNpcId((prev) => (prev === npcId ? null : npcId))
    }
  }

  const handleCharacterStartQuest = () => {
    setActiveTab("quests")
    setExpandedQuestNpcId(selectedNPC?.id ?? null)
    setShowCharacterCard(false)
    if (selectedNPC?.quest && !selectedNPC?.microQuest) {
      setShowNPCDialog(true)
    }
  }

  const handleTabChange = (tab: "map" | "quests" | "profile" | "achievements") => {
    setActiveTab(tab)
    if (tab === "map") {
      setExpandedQuestNpcId(null)
    }
  }

  const handleDialogOptionSelect = (option: { id: string; text: string; action?: string }) => {
    if (option.action === "accept_quest" && selectedNPC?.quest) {
      setActiveQuest(selectedNPC.quest)
      setShowNPCDialog(false)
      addNotification({
        type: "info",
        title: "Mission Accepted",
        message: selectedNPC.quest.title
      })
    } else if (option.action === "decline") {
      setShowNPCDialog(false)
    } else if (option.action === "micro_quest" && selectedNPC?.microQuest) {
      setShowNPCDialog(false)
      setActiveTab("quests")
      setExpandedQuestNpcId(selectedNPC.id)
    }
  }

  const handleMicroQuestComplete = async (answer: string | boolean, npcOverride?: NPC | null) => {
    const npc = npcOverride ?? selectedNPC
    if (!npc?.microQuest) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/quest/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId: npc.microQuest.id,
          placeId: npc.id,
          answers: [{ questionId: "q1", answer }]
        })
      })

      const data = await response.json().catch(() => ({}))
      setExpandedQuestNpcId((prev) => (prev === npc.id ? null : prev))

      if (!response.ok) {
        addNotification({
          type: "warning",
          title: "Submission Failed",
          message: data?.error ?? "Please try again."
        })
        return
      }

      if (data.verdict === "approved") {
        // Show reward animation
        triggerReward({
          xp: data.xpAwarded,
          blockProgress: data.blockDelta,
          message: data.npcReactionText,
          type: "success"
        })

        // Emit quest completion to Leaflet map
        window.dispatchEvent(new CustomEvent("quest:completed", {
          detail: { 
            placeId: npc.id, 
            status: "approved",
            xpAwarded: data.xpAwarded,
            blockDelta: data.blockDelta
          }
        }))
      } else {
        addNotification({
          type: "warning",
          title: "Submission Issue",
          message: data.npcReactionText
        })
      }
    } catch (error) {
      addNotification({
        type: "warning",
        title: "Connection Error",
        message: "Failed to submit. Try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Send chat message to NPC via API
  const handleSendMessage = async (message: string) => {
    if (!selectedNPC) return

    // Add player message
    const playerMsg = {
      id: Date.now().toString(),
      sender: "player" as const,
      text: message
    }
    setChatMessages(prev => [...prev, playerMsg])
    setIsNPCTyping(true)

    try {
      const response = await fetch("/api/npc/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcId: selectedNPC.id,
          placeId: selectedNPC.id,
          userText: message,
          currentNPCState: {
            trustLevel: selectedNPC.trustLevel || 50,
            questsCompleted: selectedNPC.character?.questsCompleted || 0
          }
        })
      })

      const data = await response.json().catch(() => ({}))
      const reply = typeof data?.npcReply === "string" ? data.npcReply : "...[no response]... Try again."
      const npcMsg = {
        id: (Date.now() + 1).toString(),
        sender: "npc" as const,
        text: reply
      }
      setChatMessages(prev => [...prev, npcMsg])
    } catch (error) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: "npc" as const,
        text: "...[signal lost]... Try again."
      }
      setChatMessages(prev => [...prev, errorMsg])
    } finally {
      setIsNPCTyping(false)
    }
  }

  const handlePhotoSubmit = async (photoUrl: string) => {
    setIsSubmitting(true)
    
    try {
      const questId = selectedNPC?.microQuest 
        ? selectedNPC.microQuest.id 
        : activeQuest?.id || "photo-quest"
      
      const response = await fetch("/api/quest/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId,
          placeId: selectedNPC?.id || "unknown",
          photoUrl
        })
      })

      const data = await response.json().catch(() => ({}))
      setShowPhotoProof(false)
      if (selectedNPC?.microQuest) {
        setExpandedQuestNpcId((prev) => (prev === selectedNPC.id ? null : prev))
      }

      if (!response.ok) {
        addNotification({
          type: "warning",
          title: "Submission Failed",
          message: data?.error ?? "Please try again."
        })
        return
      }

      if (data.verdict === "approved") {
        // Update quest if it's an active quest
        if (activeQuest) {
          const updatedQuest = {
            ...activeQuest,
            objectives: activeQuest.objectives.map(obj => 
              obj.requiresPhoto ? { ...obj, completed: true } : obj
            )
          }
          setActiveQuest(updatedQuest)
        }

        triggerReward({
          xp: data.xpAwarded,
          blockProgress: data.blockDelta,
          message: data.npcReactionText,
          type: "success"
        })

        // Emit to Leaflet
        window.dispatchEvent(new CustomEvent("quest:completed", {
          detail: { 
            placeId: selectedNPC?.id, 
            status: "approved",
            xpAwarded: data.xpAwarded
          }
        }))
      } else {
        addNotification({
          type: "warning",
          title: "Verification Failed",
          message: data.npcReactionText
        })
      }
    } catch (error) {
      addNotification({
        type: "warning",
        title: "Upload Failed",
        message: "Could not submit photo. Try again."
      })
      setShowPhotoProof(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Map placeholder area - markers would be rendered by Leaflet */}
      <div className="absolute inset-0 pointer-events-auto">
        {/* Demo markers - in real implementation these would be Leaflet markers */}
        {npcs.map(npc => (
          <MapMarker
            key={npc.id}
            type={npc.quest ? "quest" : npc.microQuest ? "npc" : npc.mood === "neutral" ? "mystery" : "npc"}
            name={npc.name}
            distance={Math.floor(Math.random() * 500) + 100}
            isActive={selectedNPC?.id === npc.id}
            onClick={() => handleMarkerClick(npc)}
            style={{
              left: `${npc.position.x}%`,
              top: `${npc.position.y}%`,
              pointerEvents: 'auto'
            }}
          />
        ))}
      </div>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-auto">
        <StatusBar 
          playerName="RUNNER_X7"
          level={playerStats.level}
          xp={playerStats.xp}
          maxXp={playerStats.maxXp}
          streak={playerStats.streak}
          questsCompleted={playerStats.questsCompleted}
        />
      </div>

      {/* Quest Tracker - Top Right (z-20 so it stays visible when panels open) */}
      <div className="absolute top-24 right-4 left-4 md:left-auto md:w-64 pointer-events-auto z-20">
        <QuestTracker
          activeQuest={activeQuest}
          activeMissionCount={(activeQuestNpcId || expandedQuestNpcId) ? 1 : 0}
          onQuestClick={() => {
            if (activeQuest?.objectives.some(o => o.requiresPhoto && !o.completed)) {
              setShowPhotoProof(true)
            }
          }}
        />
      </div>

      {/* Trophies Panel - Completed tasks and badges */}
      {activeTab === "achievements" && (
        <TrophiesTab />
      )}

      {/* Profile Panel - Your Character (same style as other tabs, no pop-up) */}
      {activeTab === "profile" && (
        <ProfileTab
          playerStats={{
            level: playerStats.level,
            xp: playerStats.xp,
            maxXp: playerStats.maxXp,
            questsCompleted: playerStats.questsCompleted,
            milesWalked: playerStats.milesWalked,
            streak: playerStats.streak,
          }}
        />
      )}

      {/* Quests Panel - Task content only here, never as a pop-up on the map */}
      {activeTab === "quests" && (
        <div className="absolute bottom-24 left-0 right-0 max-h-[60vh] overflow-y-auto pointer-events-auto z-25 bg-background/95 backdrop-blur-md border-t border-border">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-mono text-foreground uppercase tracking-wider">All Nearby Tasks</h3>
              <span className="text-xs font-mono text-primary">{npcs.length} available</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {npcs.map((npc) => {
                const isActive = activeQuestNpcId === npc.id
                const isExpanded = expandedQuestNpcId === npc.id
                return (
                  <div
                    key={npc.id}
                    className={`w-full rounded-lg transition-all duration-200 overflow-hidden ${
                      isActive
                        ? "border-2 border-neon-green bg-neon-green/5 shadow-[0_0_12px_var(--neon-green)]"
                        : "border border-border bg-card/80 hover:border-primary/50"
                    }`}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => handleNPCCardSelect(npc.id)}
                    >
                      <div className="flex items-stretch">
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-l-lg overflow-hidden">
                          <div className={`w-full h-full bg-gradient-to-br flex items-center justify-center ${isActive ? "from-neon-green/20 to-neon-green/10" : "from-muted/30 to-muted/20"}`}>
                            <span className={`text-xl font-mono font-bold ${isActive ? "text-neon-green" : "text-muted-foreground"}`}>
                              {npc.avatarInitial}
                            </span>
                          </div>
                          <div className="absolute bottom-0.5 left-0.5 px-1 py-0.5 rounded bg-background/90 backdrop-blur-sm">
                            <span className={`text-[7px] font-mono uppercase font-bold ${isActive ? "text-neon-green" : "text-muted-foreground"}`}>
                              {npc.microQuest?.type === "photo" ? "Photo" : npc.microQuest?.type === "yes_no" ? "Survey" : npc.microQuest?.type === "description" ? "Description" : "Verify"}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 p-2 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <h4 className="text-xs font-mono font-bold text-foreground truncate">{npc.name}</h4>
                              <span className={`text-[9px] font-mono ${isActive ? "text-neon-green" : "text-muted-foreground"}`}>+{npc.microQuest?.reward?.xp || 50} XP</span>
                            </div>
                            <p className="text-[9px] font-mono text-primary uppercase tracking-wide truncate">{npc.title}</p>
                          </div>
                          <p className="text-[9px] font-mono text-muted-foreground line-clamp-1 leading-tight">
                            {npc.microQuest?.description || npc.quest?.description || "No active task"}
                          </p>
                        </div>
                      </div>
                    </button>
                    {/* Inline quest content when expanded - part of task card, no pop-up */}
                    {isExpanded && npc.microQuest && (
                      <div className="border-t border-neon-green/30 bg-neon-green/5 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-neon-green uppercase tracking-widest">
                            {npc.microQuest.type === "photo" ? "Upload Photo" : npc.microQuest.type === "yes_no" ? "Survey" : npc.microQuest.type === "description" ? "Description" : "Task"}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-neon-green">+{npc.microQuest.reward.xp} XP</span>
                        </div>
                        <p className="text-xs font-mono text-foreground/90 leading-relaxed">{npc.microQuest.description}</p>
                        {npc.microQuest.question && (
                          <div className="bg-neon-green/10 rounded-lg p-2 border border-neon-green/30">
                            <p className="text-xs font-mono text-foreground text-center">{npc.microQuest.question}</p>
                          </div>
                        )}
                        {npc.microQuest.hint && (
                          <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {npc.microQuest.hint}
                          </p>
                        )}
                        <div className="space-y-2">
                          {npc.microQuest.type === "photo" && (
                            <Button
                              className="w-full h-9 font-mono text-xs bg-neon-green/20 border border-neon-green text-neon-green hover:bg-neon-green/30"
                              onClick={() => { setSelectedNPC(npc); setShowPhotoProof(true) }}
                              disabled={isSubmitting}
                            >
                              <Camera className="w-3.5 h-3.5 mr-2" />
                              {isSubmitting ? "Uploading..." : "Upload Photo"}
                            </Button>
                          )}
                          {npc.microQuest.type === "yes_no" && (
                            <div className="flex gap-2">
                              <Button
                                className={`flex-1 h-9 font-mono text-xs border ${questPanelYesNo[npc.id] === true ? "bg-neon-green/30 border-neon-green text-neon-green" : "bg-neon-green/10 border-neon-green/50 text-neon-green hover:bg-neon-green/20"}`}
                                onClick={() => { setQuestPanelYesNo((a) => ({ ...a, [npc.id]: true })); handleMicroQuestComplete(true, npc) }}
                                disabled={isSubmitting || questPanelYesNo[npc.id] !== undefined}
                              >
                                <Check className="w-3.5 h-3.5 mr-1.5" /> Yes
                              </Button>
                              <Button
                                className={`flex-1 h-9 font-mono text-xs border ${questPanelYesNo[npc.id] === false ? "bg-destructive/30 border-destructive text-destructive" : "bg-destructive/10 border-destructive/50 text-destructive hover:bg-destructive/20"}`}
                                onClick={() => { setQuestPanelYesNo((a) => ({ ...a, [npc.id]: false })); handleMicroQuestComplete(false, npc) }}
                                disabled={isSubmitting || questPanelYesNo[npc.id] !== undefined}
                              >
                                <X className="w-3.5 h-3.5 mr-1.5" /> No
                              </Button>
                            </div>
                          )}
                          {npc.microQuest.type === "description" && (
                            <>
                              <div className="rounded-lg border border-neon-green/30 bg-background/50 p-2">
                                <Textarea
                                  placeholder="Type your answer..."
                                  value={questPanelDescription[npc.id] ?? ""}
                                  onChange={(e) => setQuestPanelDescription((a) => ({ ...a, [npc.id]: e.target.value }))}
                                  className="min-h-[80px] text-xs font-mono resize-none border-0 bg-transparent placeholder:text-muted-foreground/60 focus-visible:ring-0"
                                  disabled={isSubmitting}
                                />
                              </div>
                              <Button
                                className="w-full h-9 font-mono text-xs bg-neon-green/20 border border-neon-green text-neon-green hover:bg-neon-green/30"
                                onClick={() => {
                                  const text = questPanelDescription[npc.id]?.trim()
                                  if (text) handleMicroQuestComplete(text, npc)
                                }}
                                disabled={isSubmitting || !(questPanelDescription[npc.id]?.trim())}
                              >
                                <Check className="w-3.5 h-3.5 mr-2" />
                                Submit
                              </Button>
                            </>
                          )}
                          {(npc.microQuest.type === "confirm" || npc.microQuest.type === "location") && (
                            <Button
                              className="w-full h-9 font-mono text-xs bg-neon-green/20 border border-neon-green text-neon-green hover:bg-neon-green/30"
                              onClick={() => handleMicroQuestComplete(true, npc)}
                              disabled={isSubmitting}
                            >
                              <Check className="w-3.5 h-3.5 mr-2" /> {npc.microQuest.type === "location" ? "I'm Here" : "Confirm"}
                            </Button>
                          )}
                        </div>
                        {npc.microQuest.reward.blockProgress && (
                          <div className="pt-2 border-t border-neon-green/30 flex justify-between text-[10px] font-mono text-muted-foreground">
                            <span>Block Progress</span>
                            <span className="text-neon-green">+{npc.microQuest.reward.blockProgress}%</span>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveQuestNpcId((prev) => (prev === npc.id ? null : npc.id))}
                      className={`w-full py-2 px-2 border-t flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                        isActive
                          ? "border-neon-green/40 bg-neon-green/15 text-neon-green"
                          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {isActive ? "Active" : "Activate"}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto z-30">
        <ActionBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          questCount={npcs.length}
        />
      </div>

      {/* NPC Dialog - Bottom Sheet on Mobile, Side Drawer on Desktop */}
      <NPCDialog
        isOpen={showNPCDialog}
        onClose={() => {
          setShowNPCDialog(false)
          setChatMessages([])
        }}
        npc={selectedNPC ? {
          name: selectedNPC.name,
          title: selectedNPC.title,
          avatarInitial: selectedNPC.avatarInitial,
          mood: selectedNPC.mood,
          trustLevel: selectedNPC.trustLevel
        } : {
          name: "Unknown",
          title: "???",
          avatarInitial: "?",
          mood: "neutral",
          trustLevel: 0
        }}
        messages={selectedNPC?.quest ? [
          `Connection established. I am ${selectedNPC.name}.`,
          "I have a task that requires... discretion. The corps won't see this coming.",
          `${selectedNPC.quest.description}. Interested?`
        ] : selectedNPC?.microQuest ? [
          `Hey there, runner. ${selectedNPC.name} here.`,
          "Got a quick task for you if you're interested. Nothing too heavy.",
          `${selectedNPC.microQuest.description}`
        ] : [
          "Neural link established...",
          "I don't have anything for you right now. Check back later."
        ]}
        options={selectedNPC?.quest ? [
          { id: "1", text: "Accept the mission", action: "accept_quest" },
          { id: "2", text: "Tell me more about the reward" },
          { id: "3", text: "Maybe later", action: "decline" }
        ] : selectedNPC?.microQuest ? [
          { id: "1", text: "Show me the task", action: "micro_quest" },
          { id: "2", text: "Not right now", action: "decline" }
        ] : [
          { id: "1", text: "Understood. I'll return.", action: "decline" }
        ]}
        onOptionSelect={handleDialogOptionSelect}
        onSendMessage={handleSendMessage}
        isTyping={isNPCTyping}
        showChatInput={true}
      />

      {/* Photo Proof Modal */}
      <PhotoProof
        isOpen={showPhotoProof}
        onClose={() => !isSubmitting && setShowPhotoProof(false)}
        onSubmit={handlePhotoSubmit}
        objective={
          selectedNPC?.microQuest?.type === "photo"
            ? selectedNPC.microQuest.title
            : activeQuest?.objectives.find(o => o.requiresPhoto)?.text || "Take a photo"
        }
        hint={
          selectedNPC?.microQuest?.hint
            ? selectedNPC.microQuest.hint
            : "Make sure the target is clearly visible in frame"
        }
        isSubmitting={isSubmitting}
      />

      {/* Location Screen with NPC Cards */}
      {showLocationScreen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-background pointer-events-auto">
          {/* Location Display - Top 3/4 */}
          <div className="relative flex-1 min-h-0">
            <LocationDisplay 
              location={currentLocation}
              onLocationChange={() => {}}
            />
            
            {/* Close button */}
            <button
              onClick={() => setShowLocationScreen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors z-10"
            >
              <span className="text-lg">x</span>
            </button>
          </div>

          {/* NPC Cards Strip - Bottom 1/4 */}
          <div className="relative bg-background/95 backdrop-blur-md border-t border-border pt-3 pb-6">
            <NPCCardStrip
              npcs={npcs.map(npc => ({
                id: npc.id,
                name: npc.name,
                title: npc.title,
                avatarInitial: npc.avatarInitial,
                trustLevel: npc.trustLevel || 50,
                taskPreview: npc.microQuest?.description || npc.quest?.description || "No active task",
                taskType: npc.microQuest?.type === "photo" ? "photo" : npc.microQuest?.type === "yes_no" ? "yes_no" : npc.microQuest?.type === "description" ? "description" : "confirm",
                microQuest: npc.microQuest,
                imageUrl: npc.character?.imageUrl
              }))}
              onNPCSelect={handleNPCCardSelect}
              selectedNPCId={selectedNPC?.id}
              activeNPCId={activeQuestNpcId}
              onActivate={(npcId) => setActiveQuestNpcId((prev) => (prev === npcId ? null : npcId))}
              expandedNPCId={expandedQuestNpcId}
              onPhotoCapture={() => setShowPhotoProof(true)}
              onQuestComplete={(npcId, answer) => {
                const npc = npcs.find(n => n.id === npcId)
                if (npc) handleMicroQuestComplete(answer, npc)
              }}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Character Card */}
      {selectedNPC?.character && (
        <CharacterCard
          isOpen={showCharacterCard}
          onClose={() => setShowCharacterCard(false)}
          character={selectedNPC.character}
          initialMessage={
            selectedNPC.microQuest 
              ? `Hey there, I'm ${selectedNPC.name}. ${selectedNPC.microQuest.description}`
              : selectedNPC.quest
                ? `Connection established. ${selectedNPC.quest.description}. Are you ready?`
                : `Greetings, traveler. I am ${selectedNPC.name}, ${selectedNPC.title.toLowerCase()}. What brings you to my location?`
          }
          onStartQuest={handleCharacterStartQuest}
          onSendMessage={handleSendMessage}
          isTyping={isNPCTyping}
          chatMessages={chatMessages}
        />
      )}

      {/* Reward Animation */}
      <RewardAnimation
        isVisible={showReward}
        onComplete={() => setShowReward(false)}
        reward={currentReward || { xp: 0 }}
      />

      {/* Notifications */}
      <NotificationStack 
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {/* Scanline overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none opacity-30" />
    </div>
  )
}
