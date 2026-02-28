/**
 * GET /api/places/[placeId]/reviews
 * Returns Google Place reviews split into oneStar (rating <= 2) and fiveStar (rating >= 4).
 * Server-side only; uses GOOGLE_PLACES_API_KEY.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchPlaceReviews } from "@/lib/place-reviews";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params;
    if (!placeId) {
      return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
    }

    const { oneStar, fiveStar } = await fetchPlaceReviews(placeId);
    return NextResponse.json({ oneStar, fiveStar });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reviews fetch error";
    return NextResponse.json({ error: message, oneStar: [], fiveStar: [] }, { status: 500 });
  }
}
