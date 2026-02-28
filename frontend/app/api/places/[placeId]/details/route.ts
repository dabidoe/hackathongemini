/**
 * Fetches Place Details from Google (Legacy API).
 * Returns accessibility info (wheelchair_accessible_entrance), business_status, opening_hours when available.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchPlaceDetails } from "@/lib/place-details";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params;
    if (!placeId) {
      return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_PLACES_API_KEY is not set" },
        { status: 500 }
      );
    }

    const details = await fetchPlaceDetails(placeId);
    if (!details) {
      return NextResponse.json(
        { error: "Place not found or API error" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      name: details.name,
      formattedAddress: details.formattedAddress,
      rating: details.rating,
      userRatingsTotal: details.userRatingsTotal,
      wheelchairAccessibleEntrance: details.wheelchairAccessibleEntrance,
      businessStatus: details.businessStatus,
      openNow: details.openNow,
      types: details.types,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Place Details error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
