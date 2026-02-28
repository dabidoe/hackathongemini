/**
 * Portrait generation: imageUrl + style (fantasy | cyberpunk) → generated image as base64.
 * Uses Google GenAI (gemini-2.5-flash-image) via:
 *   - Vertex AI when GOOGLE_CLOUD_PROJECT (and GOOGLE_CLOUD_REGION) are set, or
 *   - Gemini API when GOOGLE_CLOUD_API_KEY / GOOGLE_API_KEY is set.
 * Falls back to Nano Banana if neither is configured. No Firebase required.
 */

import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai"

export const runtime = "nodejs"

const FANTASY_PROMPT =
  "Transform this photo into a high-quality fantasy illustration, 8k, cinematic lighting, painterly, mysterious timeless mood, saturated yet natural fantasy palette, in the style of Greg Rutkowski, Ruan Jia, Marc Simonetti. Keep the person's face and identity recognizable. No text."

const CYBERPUNK_PROMPT =
  "Transform this photo into a cyberpunk illustration, near-future dystopian tone, moody neon undertones, high contrast lighting, cybernetic, subtle holographic glow, atmospheric haze, volumetric light beams, deep shadows, cinematic color grading, sharp detail. Keep the person's face and identity recognizable. No text."

const NANO_BANANA_BASE = "https://nanobananapro.cloud/api/v1/image/nano-banana"
const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 30

/** Official Gemini 2.5 Flash Image via @google/genai (Gemini API or Vertex AI). */
async function callGeminiImageEdit(args: {
  prompt: string
  base64Image: string
  mimeType: string
  apiKey?: string
  vertexai?: boolean
  project?: string
  location?: string
}): Promise<string> {
  const { prompt, base64Image, mimeType, apiKey, vertexai, project, location } = args
  const ai =
    vertexai && project
      ? new GoogleGenAI({
          vertexai: true,
          project,
          location: location ?? "us-central1",
        })
      : new GoogleGenAI({ apiKey: apiKey! })

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
    ],
    config: {
      temperature: 1,
      topP: 0.95,
      maxOutputTokens: 32768,
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: "3:4",
        imageSize: "1K",
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.OFF },
      ],
    },
  })

  const candidates = response.candidates
  if (!candidates?.length) throw new Error("No response from Gemini")
  const parts = candidates[0].content?.parts ?? []
  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data
    }
  }
  throw new Error("Gemini did not return an image")
}

async function pollNanoBananaResult(apiKey: string, taskId: string): Promise<string | null> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    const res = await fetch(`${NANO_BANANA_BASE}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ taskId }),
    })
    const data = (await res.json().catch(() => ({}))) as {
      data?: { status?: string; results?: Array<{ url?: string }> }
    }
    if (data?.data?.status === "succeeded" && data?.data?.results?.[0]?.url) {
      return data.data.results[0].url
    }
    if (data?.data?.status === "failed") return null
  }
  return null
}

/** Fallback: Nano Banana (nanobananapro.cloud) image-to-image. */
async function callNanoBananaImageEdit(args: {
  prompt: string
  imageUrl: string
  apiKey: string
}): Promise<string> {
  const { prompt, imageUrl, apiKey } = args
  const formData = new FormData()
  formData.append("prompt", prompt)
  formData.append("model", "nano-banana-2")
  formData.append("mode", "image-to-image")
  formData.append("imageUrl", imageUrl)
  formData.append("aspectRatio", "3:4")
  formData.append("imageSize", "1K")
  formData.append("outputFormat", "png")

  const submitRes = await fetch(NANO_BANANA_BASE, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })
  const submitData = (await submitRes.json().catch(() => ({}))) as {
    code?: number
    message?: string
    data?: {
      id?: string
      taskId?: string
      task_id?: string
      results?: Array<{ url?: string }>
    }
  }

  if (!submitRes.ok) {
    const msg = submitData?.message ?? submitData?.data?.error ?? "Nano Banana request failed"
    throw new Error(msg)
  }
  if (submitData?.code !== undefined && submitData.code !== 0) {
    throw new Error(submitData?.data?.error ?? submitData?.message ?? "Nano Banana error")
  }

  const immediateUrl = submitData?.data?.results?.[0]?.url ?? null
  if (immediateUrl) return immediateUrl

  const taskId =
    submitData?.data?.id ?? submitData?.data?.taskId ?? submitData?.data?.task_id
  if (!taskId) throw new Error("No task ID from Nano Banana")

  const resultUrl = await pollNanoBananaResult(apiKey, taskId)
  if (!resultUrl) throw new Error("Generation timed out or failed")
  return resultUrl
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : ""
    const style = (body?.style ?? "fantasy").toString().toLowerCase()
    const useFantasy = style !== "cyberpunk"

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing imageUrl. Upload a photo first." },
        { status: 400 }
      )
    }

    // 1) Fetch image bytes
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) throw new Error("Failed to fetch source image")
    const arrayBuffer = await imgRes.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString("base64")
    const mimeType = imgRes.headers.get("content-type") || "image/jpeg"

    // 2) Build prompt
    const prompt = useFantasy ? FANTASY_PROMPT : CYBERPUNK_PROMPT

    const googleKey = process.env.GOOGLE_CLOUD_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim()
    const project = process.env.GOOGLE_CLOUD_PROJECT?.trim()
    const region = process.env.GOOGLE_CLOUD_REGION?.trim() || "us-central1"
    const nanoKey = process.env.NANO_BANANA_API_KEY?.trim()

    const useVertex = !googleKey && !!project
    const useGeminiApi = !!googleKey

    let generatedBase64: string
    let imageUrlOut: string | undefined

    if (useVertex) {
      // 3a) Vertex AI (GOOGLE_CLOUD_PROJECT + GOOGLE_CLOUD_REGION; uses ADC)
      generatedBase64 = await callGeminiImageEdit({
        prompt,
        base64Image,
        mimeType,
        vertexai: true,
        project,
        location: region,
      })
    } else if (useGeminiApi) {
      // 3b) Gemini API (GOOGLE_CLOUD_API_KEY / GOOGLE_API_KEY)
      generatedBase64 = await callGeminiImageEdit({
        prompt,
        base64Image,
        mimeType,
        apiKey: googleKey,
      })
    } else if (nanoKey) {
      // 3b) Fallback: Nano Banana
      const resultImageUrl = await callNanoBananaImageEdit({ prompt, imageUrl, apiKey: nanoKey })
      const genRes = await fetch(resultImageUrl)
      if (!genRes.ok) throw new Error("Failed to fetch generated image")
      const genBuffer = await genRes.arrayBuffer()
      generatedBase64 = Buffer.from(genBuffer).toString("base64")
      imageUrlOut = resultImageUrl
    } else {
      return NextResponse.json(
        {
          error:
            "Set GOOGLE_CLOUD_PROJECT (and GOOGLE_CLOUD_REGION) for Vertex AI, or GOOGLE_CLOUD_API_KEY for Gemini API, or NANO_BANANA_API_KEY in .env.local",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      generatedBase64,
      imageUrl: imageUrlOut,
      prompt,
      style: useFantasy ? "fantasy" : "cyberpunk",
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    console.error("generate-portrait error:", e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
