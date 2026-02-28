/**
 * Backend route: generate tasks from real review signals using Gemini.
 * Accepts a `places` array (from /api/places POST) and returns
 * a list of micro-quests grounded in real place data and reviews.
 */

import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

export const runtime = "nodejs"

export async function POST(request: Request) {
    try {
        const { places } = await request.json()

        if (!places || !Array.isArray(places) || places.length === 0) {
            return NextResponse.json({ error: "places array is required" }, { status: 400 })
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

        // Build a compact summary of each place to feed to Gemini
        const placeSummaries = places
            .slice(0, 10)
            .map((p: any, i: number) => {
                const reviewSnippets = (p.reviews ?? [])
                    .slice(0, 2)
                    .map((r: any) => `"${r.text?.slice(0, 120)}"`)
                    .join("; ")
                return `${i + 1}. ${p.name} (rating: ${p.rating ?? "N/A"}, type: ${p.types?.[0] ?? "unknown"})${reviewSnippets ? `. Reviews: ${reviewSnippets}` : ""}`
            })
            .join("\n")

        const systemInstruction = `You are a quest designer for an urban exploration game set in a cyberpunk city. 
Given real places and their user reviews, generate creative micro-quests that send players to those locations.

Rules:
- Each quest must relate directly to the real place and its vibe.
- Quest types: "photo", "yes_no", "description", "confirm".
- Keep descriptions under 30 words.
- Be creative, fun, and cyberpunk-flavored.
- Return ONLY a JSON array, no markdown.`

        const prompt = `Here are real nearby places with review signals:\n${placeSummaries}\n\nGenerate one micro-quest per place. Return a JSON array like:\n[{"placeId":"...","placeName":"...","title":"...","description":"...","type":"photo|yes_no|description|confirm","hint":"..."}]`

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
            },
        })

        const text = response.text ?? "[]"
        let tasks: unknown[]
        try {
            tasks = JSON.parse(text)
        } catch {
            tasks = []
        }

        return NextResponse.json({ tasks })
    } catch (e: any) {
        console.error("Tasks generation error:", e)
        return NextResponse.json({ error: e.message ?? "Unknown error" }, { status: 500 })
    }
}
