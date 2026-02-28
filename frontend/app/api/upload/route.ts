/**
 * Image upload API route.
 * Accepts image file or base64, uploads to Firebase Storage, returns public URL.
 */

import { NextRequest, NextResponse } from "next/server"

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

function getExtension(mimeType: string): string {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "jpg"
  if (mimeType === "image/png") return "png"
  if (mimeType === "image/webp") return "webp"
  return "jpg"
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? ""

    let buffer: Buffer
    let mimeType: string

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("image") as File | null
      if (!file) {
        return NextResponse.json({ error: "Missing image file" }, { status: 400 })
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
          { status: 400 }
        )
      }
      if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
      }
      buffer = Buffer.from(await file.arrayBuffer())
      mimeType = file.type
    } else if (contentType.includes("application/json")) {
      const body = await request.json()
      const dataUrl = body.image ?? body.data
      if (!dataUrl || typeof dataUrl !== "string") {
        return NextResponse.json({ error: "Missing image data" }, { status: 400 })
      }
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) {
        return NextResponse.json({ error: "Invalid base64 image" }, { status: 400 })
      }
      mimeType = match[1]
      if (!ALLOWED_TYPES.includes(mimeType)) {
        mimeType = "image/jpeg"
      }
      buffer = Buffer.from(match[2], "base64")
      if (buffer.length > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 })
      }
    } else {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data or application/json" },
        { status: 400 }
      )
    }

    const { getStorageBucket } = await import("@/lib/firebase-admin")
    const bucket = getStorageBucket()
    const ext = getExtension(mimeType)
    const path = `quest-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const file = bucket.file(path)
    await file.save(buffer, {
      metadata: { contentType: mimeType },
    })

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2500", // 1 year from now
    })

    return NextResponse.json({ url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed"
    const isBucketError =
      msg.includes("bucket does not exist") ||
      (err as { code?: number })?.code === 404
    const message = isBucketError
      ? "Firebase Storage bucket not found. Enable Storage in Firebase Console: Project → Storage → Get started"
      : msg
    console.error("Upload error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
