/**
 * Server-side fetch of Google Place reviews (Legacy Place Details API).
 * Returns reviews split into low (1–2 star) and high (4–5 star) for Gemini review-intel.
 */

import type { ReviewLite } from "./review-intel-types";

interface LegacyReview {
  rating?: number;
  text?: string;
  author_name?: string;
  time?: number;
  relative_time_description?: string;
  [key: string]: unknown;
}

interface PlaceDetailsReviewsResponse {
  result?: { reviews?: LegacyReview[]; [key: string]: unknown };
  status: string;
  error_message?: string;
}

export interface FetchReviewsResult {
  oneStar: ReviewLite[];
  fiveStar: ReviewLite[];
}

export async function fetchPlaceReviews(placeId: string): Promise<FetchReviewsResult> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return { oneStar: [], fiveStar: [] };

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "reviews");
  url.searchParams.set("key", key);

  try {
    const res = await fetch(url.toString());
    const data: PlaceDetailsReviewsResponse = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") return { oneStar: [], fiveStar: [] };

    const reviews = data.result?.reviews ?? [];
    const oneStar: ReviewLite[] = [];
    const fiveStar: ReviewLite[] = [];

    for (const r of reviews) {
      const rating = typeof r.rating === "number" ? r.rating : 0;
      const text = typeof r.text === "string" ? r.text : "";
      const author_name = typeof r.author_name === "string" ? r.author_name : "Anonymous";
      const time = typeof r.time === "number" ? r.time : undefined;
      const lite: ReviewLite = { rating, text, author_name, time };
      if (rating <= 2 && text.trim()) oneStar.push(lite);
      else if (rating >= 4 && text.trim()) fiveStar.push(lite);
    }

    return { oneStar, fiveStar };
  } catch {
    return { oneStar: [], fiveStar: [] };
  }
}
