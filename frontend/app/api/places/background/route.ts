/**
 * GET /api/places/background?name=Times%20Square
 * Returns background image URL for a place. Checks Firestore first, falls back to static mapping.
 */

import { NextRequest, NextResponse } from "next/server"
import { getLocationImageUrl } from "@/lib/location-images"

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Missing name" }, { status: 400 })
  }

  try {
    // Check Firestore for override (after running seed)
    let imageUrl = ""
    try {
      const { getFirebaseFirestore } = await import("@/lib/firebase-admin")
      const db = getFirebaseFirestore()
      const lower = name.toLowerCase().replace(/^the\s+/, "")
      const candidates = [
        lower.replace(/\s+/g, "_"),
        lower.replace(/\s+/g, " "),
        ...lower.split(/\s+/).filter((w) => w.length > 2),
      ]
      for (const key of [...new Set(candidates)]) {
        const doc = await db.collection("locationBackgrounds").doc(key).get()
        if (doc.exists && doc.data()?.imageUrl) {
          imageUrl = doc.data()!.imageUrl as string
          break
        }
      }
    } catch {
      /* Firestore unavailable */
    }

    if (!imageUrl) {
      imageUrl = getLocationImageUrl(name)
    }

    return NextResponse.json({ imageUrl: imageUrl || null })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    )
  }
}
