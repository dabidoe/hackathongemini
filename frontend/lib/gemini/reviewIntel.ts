/**
 * Gemini-powered review intel: consensus summary + 4–8 verification tasks from Google reviews.
 * Uses in-memory cache (10 min TTL) so tasks route and review-intel route share results.
 */

import { GoogleGenAI } from "@google/genai";
import type { ReviewLite, ReviewIntelOutput, ReviewIntelTask } from "@/lib/review-intel-types";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, { data: ReviewIntelOutput; expires: number }>();

function getCacheKey(placeId: string): string {
  return placeId;
}

function getFromCache(placeId: string): ReviewIntelOutput | null {
  const entry = cache.get(getCacheKey(placeId));
  if (!entry || Date.now() > entry.expires) {
    if (entry) cache.delete(getCacheKey(placeId));
    return null;
  }
  return entry.data;
}

function setCache(placeId: string, data: ReviewIntelOutput): void {
  cache.set(getCacheKey(placeId), { data, expires: Date.now() + CACHE_TTL_MS });
}

const SYSTEM_PROMPT = `You are a game designer. Given Google review snippets for a real-world place (low-rated and high-rated), you produce:
1. A short consensus summary (2–4 sentences): what is consistently true about the place vs outliers. Anonymize: never use real names; say "a reviewer", "some visitors", "patrons".
2. Exactly 4–8 verification tasks for a player who will visit the place in person. Each task must ask the player to verify whether a review-based claim is legitimate (e.g. "A reviewer said the line is always long. From what you see, is that accurate?"). Tasks must be verifiable on-site only. No harassment, doxxing, or calling out real people. Do not include author names in questions or claims.
Output strict JSON only, no markdown, with this exact shape:
{"consensusSummary":"...","tasksToVerify":[{"claim":"...","question":"...","type":"yes_no"|"photo"|"description","confidence":0.0-1.0,"evidenceQuotes":["..."]}]}
Types: use "yes_no" for binary verification, "photo" for "take a photo that shows X", "description" for short text. evidenceQuotes: 1–3 short snippets from the reviews (anonymized).`;

function buildUserPrompt(placeName: string, oneStar: ReviewLite[], fiveStar: ReviewLite[]): string {
  const low =
    oneStar.length > 0
      ? oneStar.map((r) => `[${r.rating}★] ${r.text}`).join("\n")
      : "(no low-rated reviews)";
  const high =
    fiveStar.length > 0
      ? fiveStar.map((r) => `[${r.rating}★] ${r.text}`).join("\n")
      : "(no high-rated reviews)";
  return `Place: ${placeName}\n\nLow-rated reviews (1–2 stars):\n${low}\n\nHigh-rated reviews (4–5 stars):\n${high}`;
}

async function callGemini(placeName: string, oneStar: ReviewLite[], fiveStar: ReviewLite[]): Promise<ReviewIntelOutput> {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_CLOUD_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });
  const userPrompt = buildUserPrompt(placeName, oneStar, fiveStar);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { consensusSummary: "Review consensus unavailable.", tasksToVerify: [] };
  }

  const obj = parsed as Record<string, unknown>;
  const consensusSummary = typeof obj.consensusSummary === "string" ? obj.consensusSummary : "";
  const rawTasks = Array.isArray(obj.tasksToVerify) ? obj.tasksToVerify : [];
  const tasksToVerify: ReviewIntelTask[] = [];
  for (const t of rawTasks) {
    if (t && typeof t === "object" && typeof t.claim === "string" && typeof t.question === "string") {
      const type = t.type === "photo" || t.type === "description" ? t.type : "yes_no";
      const confidence = typeof t.confidence === "number" ? Math.max(0, Math.min(1, t.confidence)) : 0.5;
      const evidenceQuotes = Array.isArray(t.evidenceQuotes)
        ? (t.evidenceQuotes as unknown[]).filter((q): q is string => typeof q === "string")
        : [];
      tasksToVerify.push({ claim: t.claim, question: t.question, type, confidence, evidenceQuotes });
    }
  }
  const clamped = tasksToVerify.slice(0, 8);
  return { consensusSummary: consensusSummary || "Review consensus unavailable.", tasksToVerify: clamped };
}

/**
 * Returns review intel (consensus + tasks) for a place. Uses cache; on miss calls Gemini.
 */
export async function getReviewIntel(
  placeId: string,
  placeName: string,
  oneStar: ReviewLite[],
  fiveStar: ReviewLite[]
): Promise<ReviewIntelOutput> {
  const cached = getFromCache(placeId);
  if (cached) return cached;

  const hasReviews = oneStar.length > 0 || fiveStar.length > 0;
  if (!hasReviews) return { consensusSummary: "", tasksToVerify: [] };

  try {
    const data = await callGemini(placeName, oneStar, fiveStar);
    setCache(placeId, data);
    return data;
  } catch (err) {
    console.warn("Review intel Gemini error:", err);
    return { consensusSummary: "", tasksToVerify: [] };
  }
}
