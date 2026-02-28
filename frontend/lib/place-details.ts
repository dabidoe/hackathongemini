/**
 * Server-side Place Details fetch from Google (Legacy API).
 * Used by API routes for tasks and details endpoint.
 */

export interface PlaceDetailsData {
  name?: string;
  formattedAddress?: string;
  rating?: number;
  userRatingsTotal?: number;
  wheelchairAccessibleEntrance?: boolean;
  businessStatus?: string;
  openNow?: boolean;
  types?: string[];
}

interface PlaceDetailsResult {
  name?: string;
  wheelchair_accessible_entrance?: boolean;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  opening_hours?: { open_now?: boolean; weekday_text?: string[] };
  types?: string[];
  [key: string]: unknown;
}

interface PlaceDetailsResponse {
  result?: PlaceDetailsResult;
  status: string;
  error_message?: string;
}

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetailsData | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;

  const fields = [
    "name",
    "formatted_address",
    "rating",
    "user_ratings_total",
    "wheelchair_accessible_entrance",
    "business_status",
    "opening_hours/open_now",
    "types",
  ].join(",");

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", fields);
  url.searchParams.set("key", key);

  try {
    const res = await fetch(url.toString());
    const data: PlaceDetailsResponse = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") return null;

    const result = data.result ?? {};
    return {
      name: result.name,
      formattedAddress: result.formatted_address,
      rating: result.rating,
      userRatingsTotal: result.user_ratings_total,
      wheelchairAccessibleEntrance: result.wheelchair_accessible_entrance,
      businessStatus: result.business_status,
      openNow: result.opening_hours?.open_now,
      types: result.types,
    };
  } catch {
    return null;
  }
}
