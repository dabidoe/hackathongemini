import { NextRequest, NextResponse } from "next/server"

// Exact style prompts (fantasy / cyberpunk) for nanobanana image-to-image
const FANTASY_BASE =
  "high resolution fantasy image, 8k, layered environmental depth, dramatic cinematic lighting, mysterious timeless mood, saturated yet natural fantasy palette, in the style of inspired by Greg Rutkowski, Ruan Jia, Marc Simonetti"

const CYBERPUNK_BASE =
  "cyberpunk aesthetic, near-future dystopian tone, moody neon undertones, high contrast lighting, cybernetic, subtle holographic glow, atmospheric haze, volumetric light beams, deep shadows, cinematic color grading, sharp detail, immersive high-tech atmosphere"

interface Chips {
  theme?: string
  class?: string
  eyeColor?: string
  hairColor?: string
  hat?: string
}

function buildPromptFromThemeAndChips(theme: string, chips: Chips): string {
  const base = theme === "Cyberpunk" ? CYBERPUNK_BASE : FANTASY_BASE
  const parts: string[] = []
  if (chips.class) parts.push(`${chips.class.toLowerCase()} class`)
  if (chips.eyeColor) parts.push(`${chips.eyeColor.toLowerCase()} eyes`)
  if (chips.hairColor) parts.push(`${chips.hairColor.toLowerCase()} hair`)
  if (chips.hat && chips.hat !== "None") parts.push(`wearing ${chips.hat.toLowerCase()}`)
  const suffix = parts.length ? ", " + parts.join(", ") : ""
  return `Character portrait: transform this photo into ${base}${suffix}. Keep the person's face and identity recognizable.`
}

const NANO_BANANA_BASE = "https://nanobananapro.cloud/api/v1/image/nano-banana"
const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 30

async function pollForResult(
  apiKey: string,
  taskId: string
): Promise<{ url: string } | null> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    const res = await fetch(`${NANO_BANANA_BASE}/result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ taskId }),
    })
    const data = (await res.json().catch(() => ({}))) as {
      code?: number
      data?: {
        status?: string
        results?: Array<{ url?: string }>
      }
    }
    if (data?.data?.status === "succeeded" && data?.data?.results?.[0]?.url) {
      return { url: data.data.results[0].url }
    }
    if (data?.data?.status === "failed") {
      return null
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : ""
    const chips = (body?.chips ?? {}) as Chips

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing imageUrl. Upload a photo first." },
        { status: 400 }
      )
    }

    const apiKey = process.env.NANO_BANANA_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing NANO_BANANA_API_KEY in .env.local" },
        { status: 500 }
      )
    }

    const theme = chips.theme ?? "Fantasy"
    const builtPrompt = buildPromptFromThemeAndChips(theme, chips)

    const formData = new FormData()
    formData.append("prompt", builtPrompt)
    formData.append("model", "nano-banana-2")
    formData.append("mode", "image-to-image")
    formData.append("imageUrl", imageUrl)
    formData.append("aspectRatio", "3:4")
    formData.append("imageSize", "1K")
    formData.append("outputFormat", "png")

    try {
      const submitRes = await fetch(NANO_BANANA_BASE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      })

      const submitData = (await submitRes.json().catch(() => ({}))) as {
        code?: number
        message?: string
        data?: { id?: string; taskId?: string; error?: string; failure_reason?: string }
      }

      if (!submitRes.ok) {
        const rawMsg = submitData?.message ?? submitData?.data?.error ?? (typeof submitData === "object" ? JSON.stringify(submitData) : "Nano Banana submit failed")
        const errMsg =
          submitRes.status === 401
            ? "Invalid or missing NANO_BANANA_API_KEY. Get a key from nanobananapro.cloud (not bananapro.site). Restart dev server after updating .env.local."
            : rawMsg
        throw new Error(errMsg)
      }

      if (submitData?.code !== undefined && submitData.code !== 0) {
        const errMsg = submitData?.data?.error ?? submitData?.data?.failure_reason ?? submitData?.message ?? "Nano Banana returned an error"
        throw new Error(errMsg)
      }

      const taskId =
        submitData?.data?.id ??
        submitData?.data?.taskId ??
        submitData?.data?.task_id ??
        (submitData as { id?: string; taskId?: string; task_id?: string })?.id ??
        (submitData as { id?: string; taskId?: string; task_id?: string })?.taskId ??
        (submitData as { id?: string; taskId?: string; task_id?: string })?.task_id

      const immediateResults = submitData?.data?.results
      const immediateUrl = Array.isArray(immediateResults) && immediateResults[0]?.url ? immediateResults[0].url : null

      const useFirebase =
        !!process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
        !!process.env.FIREBASE_SERVICE_ACCOUNT?.trim()

      if (immediateUrl) {
        if (!useFirebase) {
          return NextResponse.json({ success: true, imageUrl: immediateUrl, prompt: builtPrompt, message: "Character portrait generated successfully" })
        }
        const imgRes = await fetch(immediateUrl)
        if (imgRes.ok) {
          try {
            const imageData = Buffer.from(await imgRes.arrayBuffer())
            const { getStorageBucket } = await import("@/lib/firebase-admin")
            const bucket = getStorageBucket()
            const path = `profile-portraits/${Date.now()}-${Math.random().toString(36).slice(2)}.png`
            const file = bucket.file(path)
            await file.save(imageData, { metadata: { contentType: "image/png" } })
            const [url] = await file.getSignedUrl({ action: "read", expires: "03-01-2500" })
            return NextResponse.json({ success: true, imageUrl: url, prompt: builtPrompt, message: "Character portrait generated successfully" })
          } catch (firebaseErr) {
            return NextResponse.json({ success: true, imageUrl: immediateUrl, prompt: builtPrompt, message: "Character portrait generated successfully" })
          }
        }
      }

      if (!taskId) {
        console.error("Nano Banana submit response:", JSON.stringify(submitData))
        throw new Error(`No task ID returned. Check API key and credits. Response: ${JSON.stringify(submitData).slice(0, 300)}`)
      }

      const result = await pollForResult(apiKey, taskId)
      if (!result?.url) {
        throw new Error("Generation timed out or failed")
      }

      const imgRes = await fetch(result.url)
      if (!imgRes.ok) {
        throw new Error("Failed to fetch generated image")
      }

      if (!useFirebase) {
        return NextResponse.json({
          success: true,
          imageUrl: result.url,
          prompt: builtPrompt,
          message: "Character portrait generated successfully",
        })
      }

      const imageData = Buffer.from(await imgRes.arrayBuffer())
      try {
        const { getStorageBucket } = await import("@/lib/firebase-admin")
        const bucket = getStorageBucket()
        const path = `profile-portraits/${Date.now()}-${Math.random().toString(36).slice(2)}.png`
        const file = bucket.file(path)
        await file.save(imageData, {
          metadata: { contentType: "image/png" },
        })
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: "03-01-2500",
        })
        return NextResponse.json({
          success: true,
          imageUrl: url,
          prompt: builtPrompt,
          message: "Character portrait generated successfully",
        })
      } catch (firebaseErr) {
        return NextResponse.json({
          success: true,
          imageUrl: result.url,
          prompt: builtPrompt,
          message: "Character portrait generated successfully",
        })
      }
    } catch (genError) {
      throw genError
    }
  } catch (error) {
    const err = error as Error
    const msg = err?.message ?? "Unknown error"
    console.error("Character generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: msg,
        message: msg,
      },
      { status: 500 }
    )
  }
}
