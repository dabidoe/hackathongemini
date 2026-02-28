/**
 * Fetches Place Details from Google (Legacy API).
 * Returns accessibility info (wheelchair_accessible_entrance) when available.
 */

import { NextRequest, NextResponse } from "next/server";

interface PlaceDetailsResult {
  name?: string;
  wheelchair_accessible_entrance?: boolean;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  [key: string]: unknown;
}

interface PlaceDetailsResponse {
  result?: PlaceDetailsResult;
  status: string;
  error_message?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params;
    if (!placeId) {
      return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
    }

    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "GOOGLE_PLACES_API_KEY is not set" },
        { status: 500 }
      );
    }

    const fields = [
      "name",
      "formatted_address",
      "rating",
      "user_ratings_total",
      "wheelchair_accessible_entrance",
    ].join(",");

    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", fields);
    url.searchParams.set("key", key);

    const res = await fetch(url.toString());
    const data: PlaceDetailsResponse = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json(
        { error: data.error_message ?? data.status },
        { status: 400 }
      );
    }

    const result = data.result ?? {};
    return NextResponse.json({
      name: result.name,
      formattedAddress: result.formatted_address,
      rating: result.rating,
      userRatingsTotal: result.user_ratings_total,
      wheelchairAccessibleEntrance: result.wheelchair_accessible_entrance,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Place Details error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
