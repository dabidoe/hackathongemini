import { NextRequest, NextResponse } from "next/server"

interface NPCMessageRequest {
  npcId: string
  placeId: string
  userText: string
  currentNPCState?: {
    trustLevel: number
    questsCompleted: number
  }
}

interface NPCMessageResponse {
  npcReply: string
  updatedQuest?: {
    id: string
    title: string
    description: string
    type: "photo" | "yes_no" | "confirm" | "location"
  }
  updatedTrust: number
}

// NPC personality templates for generating responses
const npcPersonalities: Record<string, { style: string; phrases: string[] }> = {
  mysterious: {
    style: "cryptic and secretive",
    phrases: [
      "The shadows hold many secrets...",
      "Trust is earned in this city, runner.",
      "I've seen things you wouldn't believe.",
      "Information is power. Use it wisely.",
    ]
  },
  happy: {
    style: "cheerful and enthusiastic",
    phrases: [
      "Great to see you out here!",
      "You're making real progress!",
      "Keep up the good work, runner!",
      "This is what it's all about!",
    ]
  },
  neutral: {
    style: "calm and observant",
    phrases: [
      "I see. Interesting.",
      "That's useful information.",
      "Noted. Continue your observation.",
      "The network appreciates your contribution.",
    ]
  },
  urgent: {
    style: "intense and focused",
    phrases: [
      "We don't have much time.",
      "The situation is critical.",
      "Every second counts here.",
      "Stay alert, stay alive.",
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: NPCMessageRequest = await request.json()
    const { npcId, userText, currentNPCState } = body

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))

    // Get personality based on NPC (simplified - would be fetched from DB in real app)
    const personalities = Object.keys(npcPersonalities)
    const personality = npcPersonalities[personalities[parseInt(npcId) % personalities.length]]
    
    // Generate a response based on user input
    const phrases = personality.phrases
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]
    
    // Simple response logic based on user text
    let npcReply = randomPhrase
    if (userText.toLowerCase().includes("quest") || userText.toLowerCase().includes("task")) {
      npcReply = "I have something that needs doing. Are you ready to prove yourself?"
    } else if (userText.toLowerCase().includes("hello") || userText.toLowerCase().includes("hi")) {
      npcReply = `Connection established. ${randomPhrase}`
    } else if (userText.toLowerCase().includes("help")) {
      npcReply = "Help comes to those who help the network. Complete tasks, earn trust."
    }

    // Calculate trust change
    const trustChange = Math.floor(Math.random() * 3) + 1
    const updatedTrust = Math.min(100, (currentNPCState?.trustLevel || 50) + trustChange)

    const response: NPCMessageResponse = {
      npcReply,
      updatedTrust
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("NPC message error:", error)
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    )
  }
}
