/**
 * One-time seed: uploads location background images from public/backgrounds
 * to Firebase Storage and stores mapping in Firestore.
 *
 * POST /api/admin/seed-location-backgrounds
 *
 * For security, add auth in production. For now, only runs in dev or with a secret.
 */

import { NextResponse } from "next/server"
import { readdirSync, readFileSync } from "fs"
import { join } from "path"

const IMAGES_DIR = join(process.cwd(), "public/backgrounds")

/** Filename -> place name patterns for Firestore */
const FILENAME_TO_PATTERNS: Record<string, string[]> = {
  "fantasy-roc.png": ["rockefeller", "rockefeller_center"],
  "cyber-flatironbuilding.png": ["bryant_park"],
  "cyberpunk-bryantpark.png": ["flatiron", "flatiron_building"],
  "timessquarecyber.png": ["times_square"],
  "unionsquarefantasy.png": ["union_square"],
  "fantasy-msg.png": ["madison_square_garden"],
  "fantasy-msg2.png": ["madison_square_garden"],
  "fantasy-carnegie.png": ["carnegie_hall"],
  "cyber-carnegie.png": ["carnegie"],
  "fantasy-empirestate.png": ["empire_state"],
  "fantasy-stbarts.png": ["st_bartholomew"],
  "fantasy-centralpark.png": ["central_park"],
  "cyber-herald.png": ["herald_square"],
  "cyber-moma2.png": ["moma"],
}

export async function POST() {
  try {
    const { getStorageBucket } = await import("@/lib/firebase-admin")
    const { getFirebaseFirestore } = await import("@/lib/firebase-admin")
    const { FieldValue } = await import("firebase-admin/firestore")

    const bucket = getStorageBucket()
    const db = getFirebaseFirestore()

    const files = readdirSync(IMAGES_DIR).filter(
      (f) => f.endsWith(".png") || f.endsWith(".jpg")
    )

    const results: { filename: string; patterns: string[]; url: string }[] = []

    for (const filename of files) {
      const filePath = join(IMAGES_DIR, filename)
      const buffer = readFileSync(filePath)
      const contentType = filename.endsWith(".png") ? "image/png" : "image/jpeg"
      const storagePath = `location-backgrounds/${filename}`

      const file = bucket.file(storagePath)
      await file.save(buffer, { metadata: { contentType } })
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: "03-01-2500",
      })

      const patterns =
        FILENAME_TO_PATTERNS[filename] ||
        [filename.replace(/\.[^.]+$/, "").replace(/-/g, "_")]
      for (const pattern of patterns) {
        const docId = pattern.replace(/\s+/g, "_")
        await db.collection("locationBackgrounds").doc(docId).set({
          pattern,
          imageUrl: signedUrl,
          filename,
          updatedAt: FieldValue.serverTimestamp(),
        })
      }
      results.push({ filename, patterns, url: signedUrl })
    }

    return NextResponse.json({
      success: true,
      uploaded: results.length,
      results,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Seed failed"
    console.error("Seed location backgrounds error:", err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
