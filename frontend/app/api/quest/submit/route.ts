import { NextRequest, NextResponse } from "next/server"

interface QuestSubmitRequest {
  questId: string
  placeId: string
  placeName?: string
  questionType?: string
  photoUrl?: string
  answers?: {
    questionId: string
    answer: string | boolean
  }[]
}

function getQuestionType(questId: string, questionType?: string): string {
  if (questionType) return questionType
  if (questId.startsWith("mq") || questId.includes("-1")) return "photo"
  if (questId.includes("2")) return "open_for_business"
  if (questId.includes("3")) return "wheelchair_accessible"
  if (questId.includes("4")) return "description"
  return "unknown"
}

interface QuestSubmitResponse {
  verdict: "approved" | "rejected" | "needs_review"
  xpAwarded: number
  blockDelta: number
  npcReactionText: string
  streakBonus?: number
}

// Simulated verification logic
function verifySubmission(
  questType: string,
  photoUrl?: string,
  answers?: { questionId: string; answer: string | boolean }[]
): { approved: boolean; confidence: number } {
  // In a real app, this would call an AI model for photo verification
  // and validate answers against expected responses
  
  if (photoUrl) {
    // Simulate photo verification with random confidence
    const confidence = 0.7 + Math.random() * 0.3
    return { approved: confidence > 0.75, confidence }
  }
  
  if (answers && answers.length > 0) {
    // For yes/no questions, accept any answer as valid data
    return { approved: true, confidence: 1.0 }
  }
  
  // Location confirmation
  return { approved: true, confidence: 0.95 }
}

// NPC reaction messages based on verdict
const npcReactions = {
  approved: [
    "Excellent work, runner. The network grows stronger.",
    "This is exactly what we needed. Well done.",
    "Your contribution has been logged. Keep it up.",
    "Verified and recorded. You're proving yourself valuable.",
    "The data checks out. Your reputation precedes you.",
  ],
  rejected: [
    "This doesn't look right. Try again, runner.",
    "The verification failed. We need better quality.",
    "Something's off here. Can you submit again?",
    "Not quite what we were looking for. Another attempt?",
  ],
  needs_review: [
    "Interesting... This requires further analysis.",
    "Flagged for manual review. Stand by.",
    "The AI is uncertain. A human will verify shortly.",
  ]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as QuestSubmitRequest
    const questId = body?.questId ?? ""
    const placeId = body?.placeId ?? ""
    const placeName = body?.placeName ?? placeId
    const questionType = getQuestionType(questId, body?.questionType)
    const photoUrl = body?.photoUrl
    const answers = Array.isArray(body?.answers) ? body.answers : undefined

    if (!questId || !placeId) {
      return NextResponse.json(
        { error: "Missing questId or placeId" },
        { status: 400 }
      )
    }

    // Simulate API delay for "verification"
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))

    // Determine quest type from questId pattern
    const questType = String(questId).startsWith("mq") ? "micro" : "main"
    
    // Verify the submission
    const verification = verifySubmission(questType, photoUrl, answers)
    
    // Determine verdict
    let verdict: "approved" | "rejected" | "needs_review"
    if (verification.confidence >= 0.9) {
      verdict = "approved"
    } else if (verification.confidence >= 0.75) {
      verdict = verification.approved ? "approved" : "needs_review"
    } else {
      verdict = "rejected"
    }

    // Calculate rewards
    const baseXp = questType === "micro" ? 15 : 50
    const xpAwarded = verdict === "approved" ? baseXp + Math.floor(Math.random() * 10) : 0
    const blockDelta = verdict === "approved" ? Math.floor(Math.random() * 5) + 1 : 0
    const streakBonus = verdict === "approved" ? Math.floor(Math.random() * 5) : 0

    // Get reaction message
    const reactions = npcReactions[verdict]
    const npcReactionText = reactions[Math.floor(Math.random() * reactions.length)]

    const response: QuestSubmitResponse = {
      verdict,
      xpAwarded,
      blockDelta,
      npcReactionText,
      streakBonus: verdict === "approved" ? streakBonus : undefined
    }

    if (verdict === "approved" && placeId && placeId.length > 10) {
      try {
        const answer = photoUrl ?? (answers?.[0]?.answer ?? null)
        if (answer != null) {
          const { getFirebaseFirestore } = await import("@/lib/firebase-admin")
          const { FieldValue } = await import("firebase-admin/firestore")
          const db = getFirebaseFirestore()
          await db.collection("placeContributions").add({
            placeId,
            placeName,
            questionType,
            answer,
            submittedAt: FieldValue.serverTimestamp(),
            questId,
          })
        }
      } catch (firebaseErr) {
        console.warn("Failed to write placeContributions:", firebaseErr)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Quest submission error:", error)
    return NextResponse.json(
      { error: "Failed to process quest submission" },
      { status: 500 }
    )
  }
}
