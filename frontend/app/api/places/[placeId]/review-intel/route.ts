/**
 * POST /api/places/[placeId]/review-intel
 * Body: { placeName: string; oneStar: ReviewLite[]; fiveStar: ReviewLite[] }
 * Returns ReviewIntelOutput (consensusSummary + tasksToVerify). Uses in-memory cache (10 min).
 */

import { NextRequest, NextResponse } from "next/server";
import { getReviewIntel } from "@/lib/gemini/reviewIntel";
import type { ReviewLite } from "@/lib/review-intel-types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params;
    if (!placeId) {
      return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const placeName = typeof body?.placeName === "string" ? body.placeName.trim() : "";
    const oneStar = Array.isArray(body?.oneStar) ? (body.oneStar as ReviewLite[]) : [];
    const fiveStar = Array.isArray(body?.fiveStar) ? (body.fiveStar as ReviewLite[]) : [];

    const result = await getReviewIntel(placeId, placeName || placeId, oneStar, fiveStar);
    return NextResponse.json(result);
  } catch (err) {
    console.warn("Review intel route error:", err);
    return NextResponse.json(
      { consensusSummary: "", tasksToVerify: [] },
      { status: 500 }
    );
  }
}
