"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import Image from "next/image"
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
import { CharacterCard } from "./character-card"
import { ProfileTab } from "./profile-tab"
import { TrophiesTab } from "./trophies-tab"
import { useMapContextOptional } from "@/contexts/map-context"
import { useAuth } from "@/contexts/auth-context"
import { haversineMeters } from "@/lib/geo"
import { getLocationImageUrl } from "@/lib/location-images"
import type { PlaceResult } from "@/app/api/places/route"

function latLngToPercent(
  lat: number,
  lng: number,
  bounds: google.maps.LatLngBounds
): { x: number; y: number } {
  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()
  const x = ((lng - sw.lng()) / (ne.lng() - sw.lng())) * 100
  const y = ((ne.lat() - lat) / (ne.lat() - sw.lat())) * 100
  return { x, y }
}

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

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80"
const PROFILE_PORTRAIT_KEY = "app_profile_portrait"

export function GameOverlay({ onMarkerTap }: GameOverlayProps) {
  const mapContext = useMapContextOptional()
  const { user, getIdToken } = useAuth()
  const [activeTab, setActiveTab] = useState<"map" | "quests" | "profile" | "achievements">("map")
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null)
  const [showNPCDialog, setShowNPCDialog] = useState(false)
  const [showPhotoProof, setShowPhotoProof] = useState(false)
  const [showReward, setShowReward] = useState(false)
  const [showCharacterCard, setShowCharacterCard] = useState(false)
  const [showLocationScreen, setShowLocationScreen] = useState(false)
  const [currentReward, setCurrentReward] = useState<{ xp: number; blockProgress?: number; message?: string; type?: "success" | "achievement" | "level_up" } | null>(null)
  const [selectedHotspot, setSelectedHotspot] = useState<PlaceResult | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null)
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: "npc" | "player"; text: string }[]>([])
  const [isNPCTyping, setIsNPCTyping] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeQuestNpcId, setActiveQuestNpcId] = useState<string | null>(null)
  const [expandedQuestNpcId, setExpandedQuestNpcId] = useState<string | null>(null)
  const [questPanelYesNo, setQuestPanelYesNo] = useState<Record<string, boolean | null>>({})
  const [questPanelDescription, setQuestPanelDescription] = useState<Record<string, string>>({})
  const [locationTasks, setLocationTasks] = useState<Array<{
    characterId: string
    name: string
    title: string
    avatarInitial: string
    imageUrl?: string
    type: "photo" | "yes_no" | "description" | "confirm" | "location"
    description: string
    question?: string
    hint?: string
    reward: { xp: number; blockProgress?: number }
  }>>([])
  const [locationReplacementTasks, setLocationReplacementTasks] = useState<typeof locationTasks>([])
  const [locationTasksLoading, setLocationTasksLoading] = useState(false)
  const [selectedLocationTask, setSelectedLocationTask] = useState<(typeof locationTasks)[0] | null>(null)
  const [taskImageErrors, setTaskImageErrors] = useState<Set<string>>(new Set())
  const [pendingLocationPhotoTask, setPendingLocationPhotoTask] = useState<(typeof locationTasks)[0] | null>(null)
  // Initialize empty to avoid hydration mismatch (server has no localStorage).
  // Synced from localStorage in useEffect after mount.
  const [visitedPlaceIds, setVisitedPlaceIds] = useState<Set<string>>(() => new Set())
  const [visitedPlaceNames, setVisitedPlaceNames] = useState<Record<string, string>>(() => ({}))
  const [completedLocationTasks, setCompletedLocationTasks] = useState<Record<string, string[]>>(() => ({}))
  const [completedTaskHistory, setCompletedTaskHistory] = useState<Array<{
    id: string
    placeId: string
    placeName: string
    characterId: string
    characterName: string
    taskTitle: string
    xpEarned: number
    type: "photo" | "yes_no" | "description" | "confirm" | "location"
    completedAt: string
  }>>(() => [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const storedIds = localStorage.getItem("visitedPlaceIds")
      if (storedIds) {
        const parsed = JSON.parse(storedIds)
        if (Array.isArray(parsed)) setVisitedPlaceIds(new Set(parsed))
      }
      const storedNames = localStorage.getItem("visitedPlaceNames")
      if (storedNames) setVisitedPlaceNames(JSON.parse(storedNames))
      const storedCompleted = localStorage.getItem("completedLocationTasks")
      if (storedCompleted) setCompletedLocationTasks(JSON.parse(storedCompleted))
      const storedHistory = localStorage.getItem("completedTaskHistory")
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory)
        if (Array.isArray(parsed)) setCompletedTaskHistory(parsed)
      }
      const saved = localStorage.getItem(PROFILE_PORTRAIT_KEY)
      if (saved) setProfileImageUrl(saved)
    } catch { /* ignore */ }
  }, [])

  const handleProfileImageSave = useCallback((dataUrl: string) => {
    setProfileImageUrl(dataUrl)
    try {
      localStorage.setItem(PROFILE_PORTRAIT_KEY, dataUrl)
    } catch { /* quota or other */ }
  }, [])

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

  // Reset task image errors when switching places
  useEffect(() => {
    setTaskImageErrors(new Set())
  }, [selectedHotspot?.place_id])

  // Fetch location-specific tasks when a hotspot is selected
  useEffect(() => {
    if (!selectedHotspot) {
      setLocationTasks([])
      setLocationReplacementTasks([])
      return
    }
    setLocationTasksLoading(true)
    const placeId = selectedHotspot.place_id
    const placeNameForStorage = selectedHotspot.name
    const placeName = encodeURIComponent(placeNameForStorage)
    fetch(`/api/places/${placeId}/tasks?placeName=${placeName}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.tasks)) {
          setLocationTasks(data.tasks)
          setLocationReplacementTasks(Array.isArray(data.replacementTasks) ? data.replacementTasks : [])
          setVisitedPlaceIds((prev) => {
            const next = new Set(prev)
            next.add(placeId)
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("visitedPlaceIds", JSON.stringify([...next]))
              } catch { /* ignore */ }
            }
            return next
          })
          setVisitedPlaceNames((prev) => {
            const next = { ...prev, [placeId]: placeNameForStorage }
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("visitedPlaceNames", JSON.stringify(next))
              } catch { /* ignore */ }
            }
            return next
          })
        } else {
          setLocationTasks([])
          setLocationReplacementTasks([])
        }
      })
      .catch(() => {
        setLocationTasks([])
        setLocationReplacementTasks([])
      })
      .finally(() => setLocationTasksLoading(false))
  }, [selectedHotspot?.place_id])

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications(prev => [...prev, { ...notification, id }])
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const removeMission = useCallback((placeId: string) => {
    setVisitedPlaceIds((prev) => {
      const next = new Set(prev)
      next.delete(placeId)
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("visitedPlaceIds", JSON.stringify([...next]))
        } catch { /* ignore */ }
      }
      return next
    })
    setVisitedPlaceNames((prev) => {
      const next = { ...prev }
      delete next[placeId]
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("visitedPlaceNames", JSON.stringify(next))
        } catch { /* ignore */ }
      }
      return next
    })
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

  const handleHotspotClick = (hotspot: PlaceResult) => {
    setSelectedHotspot(hotspot)
    setShowLocationScreen(true)
    setSelectedLocationTask(null)
    onMarkerTap?.(hotspot.place_id)
  }

  const getQuestionType = (task: { type: string; question?: string }): string => {
    if (task.type === "photo") return "photo"
    if (task.type === "description") return "description"
    if (task.type === "yes_no" && task.question?.toLowerCase().includes("wheelchair")) return "wheelchair_accessible"
    if (task.type === "yes_no" && task.question?.toLowerCase().includes("open")) return "open_for_business"
    return "unknown"
  }

  const handleLocationTaskComplete = async (
    task: (typeof locationTasks)[0],
    answer: string | boolean
  ) => {
    if (!selectedHotspot) return
    setIsSubmitting(true)
    const placeId = selectedHotspot.place_id
    const placeName = selectedHotspot.name
    const questId = `${placeId}-${task.characterId}`

    try {
      const body: Record<string, unknown> = {
        questId,
        placeId,
        placeName,
        questionType: getQuestionType(task),
      }
      if (task.type === "photo" && typeof answer === "string") {
        body.photoUrl = answer
      } else {
        body.answers = [{ questionId: "q1", answer }]
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" }
      const token = await getIdToken()
      if (token) headers["Authorization"] = `Bearer ${token}`

      const res = await fetch("/api/quest/submit", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))

      setSelectedLocationTask(null)

      if (!res.ok) {
        addNotification({
          type: "warning",
          title: "Submission Failed",
          message: (data?.error as string) ?? "Please try again.",
        })
        return
      }

      if (data.verdict === "approved") {
        const characterName = npcs.find((n) => n.id === task.characterId)?.name ?? "Unknown"
        const entry = {
          id: `${placeId}-${task.characterId}-${Date.now()}`,
          placeId,
          placeName,
          characterId: task.characterId,
          characterName,
          taskTitle: task.title,
          xpEarned: data.xpAwarded ?? task.reward?.xp ?? 0,
          type: task.type,
          completedAt: new Date().toISOString(),
        }
        setCompletedLocationTasks((prev) => {
          const list = prev[placeId] ?? []
          if (list.includes(task.characterId)) return prev
          const next = { ...prev, [placeId]: [...list, task.characterId] }
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("completedLocationTasks", JSON.stringify(next))
            } catch { /* ignore */ }
          }
          return next
        })
        setCompletedTaskHistory((prev) => {
          const next = [...prev, entry]
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("completedTaskHistory", JSON.stringify(next))
            } catch { /* ignore */ }
          }
          return next
        })
        triggerReward({
          xp: data.xpAwarded,
          blockProgress: data.blockDelta,
          message: data.npcReactionText,
          type: "success",
        })
        if (user) {
          window.dispatchEvent(new CustomEvent("user:quest-completed"))
        }
      } else {
        addNotification({
          type: "warning",
          title: "Verification Failed",
          message: data.npcReactionText,
        })
      }
    } catch {
      addNotification({
        type: "warning",
        title: "Connection Error",
        message: "Failed to submit. Try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkerClick = (npc: NPC) => {
    setSelectedNPC(npc)
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
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      const token = await getIdToken()
      if (token) headers["Authorization"] = `Bearer ${token}`

      const response = await fetch("/api/quest/submit", {
        method: "POST",
        headers,
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
        if (user) {
          window.dispatchEvent(new CustomEvent("user:quest-completed"))
        }
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
    if (pendingLocationPhotoTask && selectedHotspot) {
      setShowPhotoProof(false)
      await handleLocationTaskComplete(pendingLocationPhotoTask, photoUrl)
      setPendingLocationPhotoTask(null)
      return
    }

    setIsSubmitting(true)

    try {
      const questId = selectedNPC?.microQuest
        ? selectedNPC.microQuest.id
        : activeQuest?.id || "photo-quest"

      const headers: Record<string, string> = { "Content-Type": "application/json" }
      const token = await getIdToken()
      if (token) headers["Authorization"] = `Bearer ${token}`

      const response = await fetch("/api/quest/submit", {
        method: "POST",
        headers,
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
        if (user) {
          window.dispatchEvent(new CustomEvent("user:quest-completed"))
        }
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

  const { bounds, hotspots, playerPos, isMapIdle } = mapContext ?? {
    map: null,
    bounds: null,
    hotspots: [] as PlaceResult[],
    playerPos: { lat: 40.758, lng: -73.9855 },
    isMapIdle: true,
  }

  const currentLocation = useMemo(() => {
    if (!selectedHotspot || !mapContext) return null
    const dist = haversineMeters(
      mapContext.playerPos.lat,
      mapContext.playerPos.lng,
      selectedHotspot.lat,
      selectedHotspot.lng
    )
    const locationImage = getLocationImageUrl(selectedHotspot.name, selectedHotspot.place_id)
    return {
      id: selectedHotspot.place_id,
      name: selectedHotspot.name,
      type: selectedHotspot.types?.[0] ?? "Point of Interest",
      imageUrl: locationImage || PLACEHOLDER_IMAGE,
      distance: Math.round(dist),
      visitorsToday: selectedHotspot.user_ratings_total,
      lastVisited: selectedHotspot.rating ? `★ ${selectedHotspot.rating}` : undefined,
    }
  }, [selectedHotspot, mapContext])

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Map area - hotspot markers + player marker (fade out during zoom/pan, fade in when idle) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{ opacity: isMapIdle ? 1 : 0 }}
      >
        {bounds &&
          hotspots.map((hotspot) => {
            const { x, y } = latLngToPercent(hotspot.lat, hotspot.lng, bounds)
            const distance = haversineMeters(
              playerPos.lat,
              playerPos.lng,
              hotspot.lat,
              hotspot.lng
            )
            const placeImageUrl = getLocationImageUrl(hotspot.name, hotspot.place_id)
            return (
              <MapMarker
                key={hotspot.place_id}
                type={hotspot.rating && hotspot.rating >= 4.5 ? "quest" : "npc"}
                name={hotspot.name}
                distance={Math.round(distance)}
                isActive={selectedHotspot?.place_id === hotspot.place_id}
                onClick={() => handleHotspotClick(hotspot)}
                placeImageUrl={placeImageUrl || undefined}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  pointerEvents: "auto",
                }}
              />
            )
          })}
        {/* Player marker - same fade behavior as hotspot markers; shows generated profile portrait when set */}
        {bounds && playerPos && (
          <MapMarker
            type="player"
            name="You"
            avatarUrl={profileImageUrl ?? undefined}
            style={{
              left: `${latLngToPercent(playerPos.lat, playerPos.lng, bounds).x}%`,
              top: `${latLngToPercent(playerPos.lat, playerPos.lng, bounds).y}%`,
              pointerEvents: "auto",
            }}
          />
        )}
      </div>

      {/* Map click to close tabs - when Profile/Quests/Trophies is open, clicking the map closes it */}
      {activeTab !== "map" && (
        <div
          className="absolute top-24 left-0 right-0 bottom-24 pointer-events-auto z-[5]"
          onClick={() => setActiveTab("map")}
          aria-label="Click to close tab and return to map"
        />
      )}

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-auto">
        <StatusBar
          playerName="RUNNER_X7"
          level={playerStats.level}
          xp={playerStats.xp}
          maxXp={playerStats.maxXp}
          streak={playerStats.streak}
          questsCompleted={playerStats.questsCompleted}
          onProfileClick={() => setActiveTab("profile")}
          profileImageUrl={profileImageUrl}
        />
      </div>

      {/* Quest Tracker - Top Right (z-20 so it stays visible when panels open) */}
      <div className="absolute top-24 right-4 left-4 md:left-auto md:w-64 pointer-events-auto z-20">
        <QuestTracker
          activeQuest={activeQuest}
          activeMissionCount={visitedPlaceIds.size}
          onQuestClick={() => {
            if (activeQuest?.objectives.some(o => o.requiresPhoto && !o.completed)) {
              setShowPhotoProof(true)
            }
          }}
        />
      </div>

      {/* Trophies Panel - Completed tasks and badges */}
      {activeTab === "achievements" && (
        <TrophiesTab
          onClose={() => setActiveTab("map")}
          completedTasks={completedTaskHistory}
          npcs={npcs}
          playerStats={playerStats}
        />
      )}

      {/* Profile Panel - Your Character (same style as other tabs, no pop-up) */}
      {activeTab === "profile" && (
        <ProfileTab
          onClose={() => setActiveTab("map")}
          playerStats={{
            level: playerStats.level,
            xp: playerStats.xp,
            maxXp: playerStats.maxXp,
            questsCompleted: playerStats.questsCompleted,
            milesWalked: playerStats.milesWalked,
            streak: playerStats.streak,
          }}
          profileImageUrl={profileImageUrl}
          onProfileImageSave={handleProfileImageSave}
        />
      )}

      {/* Quests Panel - Summary of tasks at visited locations */}
      {activeTab === "quests" && (
        <div className="absolute bottom-24 left-0 right-0 max-h-[60vh] overflow-y-auto pointer-events-auto z-25 bg-background/95 backdrop-blur-md border-t border-border">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-mono text-foreground uppercase tracking-wider">Tasks at Locations</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-primary">{visitedPlaceIds.size} visited</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("map")}
                  className="p-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {visitedPlaceIds.size === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
                <p className="text-xs font-mono text-muted-foreground mb-2">No locations visited yet.</p>
                <p className="text-[10px] font-mono text-muted-foreground/80">Open the map and tap a hotspot to start tasks.</p>
                <Button
                  className="mt-3 h-9 font-mono text-xs bg-neon-green/20 border border-neon-green text-neon-green hover:bg-neon-green/30"
                  onClick={() => setActiveTab("map")}
                >
                  Open Map
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {[...visitedPlaceIds].map((placeId) => {
                  const name = visitedPlaceNames[placeId] ?? "Unknown Place"
                  const completed = completedLocationTasks[placeId] ?? []
                  const done = completed.length
                  const total = 4
                  const allDone = done >= total
                  return (
                    <div
                      key={placeId}
                      className={`w-full rounded-lg transition-all duration-200 overflow-hidden border ${allDone ? "border-neon-green/50 bg-neon-green/5" : "border-border bg-card/80 hover:border-primary/50"
                        }`}
                    >
                      <div className="flex items-center justify-between p-3">
                        <div>
                          <h4 className="text-xs font-mono font-bold text-foreground">{name}</h4>
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                            {done}/{total} tasks done
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {allDone && (
                            <span className="text-[9px] font-mono text-neon-green uppercase">Complete</span>
                          )}
                          <Button
                            className="h-8 font-mono text-[10px] bg-neon-green/20 border border-neon-green text-neon-green hover:bg-neon-green/30"
                            onClick={() => {
                              const h = hotspots.find((x) => x.place_id === placeId)
                              if (h) {
                                setSelectedHotspot(h)
                                setShowLocationScreen(true)
                                setActiveTab("map")
                              }
                            }}
                          >
                            Open
                          </Button>
                          <button
                            type="button"
                            onClick={() => removeMission(placeId)}
                            className="p-1.5 rounded-full bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                            aria-label={`Remove ${name} from missions`}
                            title="Remove mission"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <p className="text-[10px] font-mono text-muted-foreground pt-2">
                  Tap a location on the map to complete more tasks.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto z-30">
        <ActionBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          questCount={visitedPlaceIds.size}
          profileImageUrl={profileImageUrl}
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
        onClose={() => {
          if (!isSubmitting) {
            setShowPhotoProof(false)
            setPendingLocationPhotoTask(null)
          }
        }}
        onSubmit={handlePhotoSubmit}
        objective={
          pendingLocationPhotoTask?.type === "photo"
            ? pendingLocationPhotoTask.description
            : selectedNPC?.microQuest?.type === "photo"
              ? selectedNPC.microQuest.title
              : activeQuest?.objectives.find(o => o.requiresPhoto)?.text || "Take a photo"
        }
        hint={
          pendingLocationPhotoTask?.hint
            ? pendingLocationPhotoTask.hint
            : selectedNPC?.microQuest?.hint
              ? selectedNPC.microQuest.hint
              : "Make sure the target is clearly visible in frame"
        }
        isSubmitting={isSubmitting}
      />

      {/* Location Screen - background image with overlay cards */}
      {showLocationScreen && currentLocation && (
        <div className="fixed inset-0 z-40 flex flex-col pointer-events-auto">
          {/* Full-screen Location Display (background) */}
          <div className="absolute inset-0">
            <LocationDisplay
              location={currentLocation}
              onLocationChange={() => { }}
            />
          </div>

          {/* Gradient for card readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={() => { setShowLocationScreen(false); setSelectedLocationTask(null) }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors z-20"
          >
            <span className="text-lg">x</span>
          </button>

          {/* Task cards - centered on screen, 2x2 grid, card size from profile image */}
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
            <div className="flex flex-col items-center max-h-full overflow-auto">
              <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider mb-3 shrink-0">
                Tasks at {selectedHotspot?.name}
              </h3>
              {locationTasksLoading ? (
                <p className="text-xs font-mono text-muted-foreground">Loading tasks...</p>
              ) : locationTasks.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground">No tasks at this location.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 w-full max-w-4xl">
                  {locationTasks.map((originalTask, slotIndex) => {
                    const placeId = selectedHotspot?.place_id ?? ""
                    const isOriginalCompleted = (completedLocationTasks[placeId] ?? []).includes(originalTask.characterId)
                    const replacementTask = locationReplacementTasks[slotIndex]
                    const task = isOriginalCompleted && replacementTask ? replacementTask : originalTask
                    const isCompleted = (completedLocationTasks[placeId] ?? []).includes(task.characterId)
                    const taskKey = `${placeId}-${task.characterId}`
                    const taskTypeLabel = task.type === "photo" ? "Photo" : task.type === "yes_no" ? "Survey" : task.type === "description" ? "Description" : "Task"
                    return (
                      <div
                        key={taskKey}
                        className={`relative w-full min-w-0 rounded-xl overflow-hidden border-2 bg-background/85 backdrop-blur-md shadow-lg ${isCompleted ? "border-neon-green/50" : "border-border"}`}
                      >
                        {/* Completed checkmark overlay */}
                        {isCompleted && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-1">
                              <Check className="w-10 h-10 text-neon-green" strokeWidth={2.5} />
                              <span className="text-xs font-mono font-bold text-neon-green uppercase">Completed</span>
                            </div>
                          </div>
                        )}
                        {/* Image (larger portrait) */}
                        <div className="relative w-full aspect-[3/4] overflow-hidden bg-gradient-to-br from-muted/40 to-muted/20">
                          {task.imageUrl && !taskImageErrors.has(taskKey) ? (
                            <Image
                              src={task.imageUrl}
                              alt={task.name}
                              fill
                              className="object-cover object-top"
                              sizes="(max-width: 768px) 50vw, 360px"
                              unoptimized={task.imageUrl.startsWith("/")}
                              onError={() => setTaskImageErrors((s) => new Set(s).add(taskKey))}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-mono font-bold text-muted-foreground">
                                {task.avatarInitial}
                              </span>
                            </div>
                          )}
                          <div className="absolute left-2 bottom-2 px-2 py-1 rounded-md bg-background/80 backdrop-blur border border-border">
                            <span className="text-[10px] font-mono uppercase font-bold text-foreground">
                              {taskTypeLabel}
                            </span>
                          </div>
                        </div>
                        {/* Card body (under image) */}
                        <div className="p-3">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-mono font-bold text-foreground truncate">
                              {task.name}
                            </h4>
                            <span className="text-[11px] font-mono font-semibold text-primary shrink-0">
                              +{task.reward.xp} XP
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] font-mono text-muted-foreground line-clamp-2">
                            {task.title}
                          </p>
                        </div>
                        {/* Full task detail (always visible for every card) */}
                        <div className="px-3 pb-3 border-t border-border/60 space-y-2">
                          <p className="pt-2 text-[10px] font-mono text-foreground leading-snug">
                            {task.description}
                          </p>
                          {task.question && (
                            <p className="text-[10px] font-mono text-foreground/90 italic">
                              {task.question}
                            </p>
                          )}
                          {task.hint && (
                            <p className="text-[9px] font-mono text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0" /> {task.hint}
                            </p>
                          )}
                          <div className="space-y-2 pt-1">
                            {!isCompleted && task.type === "photo" && (
                              <Button
                                className="w-full h-9 font-mono text-[10px] bg-neon-green/20 border border-neon-green text-neon-green hover:bg-neon-green/30"
                                onClick={() => {
                                  setPendingLocationPhotoTask(task)
                                  setShowPhotoProof(true)
                                  setSelectedLocationTask(null)
                                }}
                                disabled={isSubmitting}
                              >
                                <Camera className="w-3 h-3 mr-2" />
                                {isSubmitting ? "Uploading..." : "Upload Photo"}
                              </Button>
                            )}
                            {!isCompleted && task.type === "yes_no" && (
                              <div className="flex gap-2">
                                <Button
                                  className="flex-1 h-9 font-mono text-[10px] bg-neon-green/10 border border-neon-green/50 text-neon-green hover:bg-neon-green/20"
                                  onClick={() => handleLocationTaskComplete(task, true)}
                                  disabled={isSubmitting}
                                >
                                  <Check className="w-3 h-3 mr-1" /> Yes
                                </Button>
                                <Button
                                  className="flex-1 h-9 font-mono text-[10px] bg-destructive/10 border border-destructive/50 text-destructive hover:bg-destructive/20"
                                  onClick={() => handleLocationTaskComplete(task, false)}
                                  disabled={isSubmitting}
                                >
                                  <X className="w-3 h-3 mr-1" /> No
                                </Button>
                              </div>
                            )}
                            {!isCompleted && task.type === "description" && (
                              <>
                                <Textarea
                                  placeholder="Type your answer..."
                                  value={questPanelDescription[taskKey] ?? ""}
                                  onChange={(e) =>
                                    setQuestPanelDescription((a) => ({ ...a, [taskKey]: e.target.value }))
                                  }
                                  className="min-h-[72px] text-[10px] font-mono resize-none border border-neon-green/30 bg-background/50"
                                  disabled={isSubmitting}
                                />
                                <Button
                                  className="w-full h-9 font-mono text-[10px] bg-neon-green/20 border border-neon-green text-neon-green hover:bg-neon-green/30"
                                  onClick={() => {
                                    const text = questPanelDescription[taskKey]?.trim()
                                    if (text) handleLocationTaskComplete(task, text)
                                  }}
                                  disabled={isSubmitting || !(questPanelDescription[taskKey]?.trim())}
                                >
                                  <Check className="w-3 h-3 mr-2" /> Submit
                                </Button>
                              </>
                            )}
                            {!isCompleted && (task.type === "confirm" || task.type === "location") && (
                              <Button
                                className="w-full h-9 font-mono text-[10px] bg-neon-green/20 border border-neon-green text-neon-green hover:bg-neon-green/30"
                                onClick={() => handleLocationTaskComplete(task, true)}
                                disabled={isSubmitting}
                              >
                                <Check className="w-3 h-3 mr-2" /> {task.type === "location" ? "I'm Here" : "Confirm"}
                              </Button>
                            )}
                            {!isCompleted && task.reward.blockProgress && (
                              <p className="text-[9px] font-mono text-neon-green">
                                +{task.reward.blockProgress}% block
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
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
