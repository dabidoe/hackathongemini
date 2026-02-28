import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { getNPCSystemInstruction } from "@/lib/npc"

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
    type: "photo" | "yes_no" | "confirm" | "location" | "description"
  }
  updatedTrust: number
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as NPCMessageRequest
    const npcId = (body?.npcId ?? "ZERO").toUpperCase()
    const userText = typeof body?.userText === "string" ? body.userText : ""
    const currentTrust = body?.currentNPCState?.trustLevel ?? 50

    // Build the NPC system prompt
    const systemInstruction = getNPCSystemInstruction({
      npcId,
      locationName: body?.placeId,
      playerTrustLevel: currentTrust,
    })

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    })

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    })

    const text = response.text ?? "{}"

    // Parse and validate the structured JSON response
    let parsedData: NPCMessageResponse
    try {
      parsedData = JSON.parse(text) as NPCMessageResponse
    } catch {
      parsedData = {
        npcReply: text,
        updatedTrust: currentTrust,
      }
    }

    // Ensure required fields exist
    if (!parsedData.npcReply) {
      parsedData.npcReply = "...[signal interference]..."
    }
    if (!parsedData.updatedTrust) {
      parsedData.updatedTrust = currentTrust
    }

    return NextResponse.json(parsedData)
  } catch (error: any) {
    console.error("NPC message error:", error)
    return NextResponse.json(
      { error: "Failed to communicate with the Neural Network.", details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
