/**
 * Server route for Google Places API.
 * Keeps API key server-side; accepts lat, lng, radiusMeters.
 * Caches results in Firestore for 24h for faster loads.
 */

import { NextRequest, NextResponse } from "next/server";

export interface PlaceResult {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
}

interface NearbySearchResponse {
  results?: Array<{
    place_id: string;
    name: string;
    geometry: { location: { lat: number; lng: number } };
    rating?: number;
    user_ratings_total?: number;
    types?: string[];
  }>;
  status: string;
  error_message?: string;
}

const MAX_RESULTS = 60; // Use all results from 3 place types (Google returns up to 20 per type)
const PLACE_TYPES = ["tourist_attraction", "park", "point_of_interest"] as const;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function fetchNearby(
  lat: number,
  lng: number,
  radiusMeters: number,
  type: string
): Promise<PlaceResult[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_PLACES_API_KEY is not set");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", String(radiusMeters));
  url.searchParams.set("type", type);
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  const data: NearbySearchResponse = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || data.status);
  }

  if (!data.results) return [];

  return data.results.map((r) => ({
    place_id: r.place_id,
    name: r.name,
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    rating: r.rating,
    user_ratings_total: r.user_ratings_total,
    types: r.types,
  }));
}

async function fetchAndMergePlaces(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<PlaceResult[]> {
  const results = await Promise.all(
    PLACE_TYPES.map((type) => fetchNearby(lat, lng, radiusMeters, type))
  );
  const seen = new Set<string>();
  const places: PlaceResult[] = [];
  for (const list of results) {
    for (const p of list) {
      if (!seen.has(p.place_id) && places.length < MAX_RESULTS) {
        seen.add(p.place_id);
        places.push(p);
      }
    }
  }
  return places;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") ?? "");
    const lng = parseFloat(searchParams.get("lng") ?? "");
    const radiusMeters = parseInt(searchParams.get("radiusMeters") ?? "24140", 10);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Missing or invalid lat/lng" },
        { status: 400 }
      );
    }

    const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}_${radiusMeters}`;

    try {
      const { getFirebaseFirestore } = await import("@/lib/firebase-admin");
      const db = getFirebaseFirestore();
      const cacheRef = db.collection("placesCache").doc(cacheKey);
      const cached = await cacheRef.get();

      if (cached.exists) {
        const data = cached.data();
        const cachedAt = data?.cachedAt?.toMillis?.() ?? 0;
        if (Date.now() - cachedAt < CACHE_TTL_MS && Array.isArray(data?.places)) {
          return NextResponse.json({ places: data.places });
        }
      }

      const places = await fetchAndMergePlaces(lat, lng, radiusMeters);

      // Firestore rejects undefined; sanitize places before writing
      const placesForCache = places.map((p) => ({
        place_id: p.place_id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        ...(p.rating != null && { rating: p.rating }),
        ...(p.user_ratings_total != null && { user_ratings_total: p.user_ratings_total }),
        ...(p.types?.length && { types: p.types }),
      }));

      const { FieldValue } = await import("firebase-admin/firestore");
      await cacheRef.set({
        places: placesForCache,
        cachedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ places });
    } catch (firebaseErr) {
      console.warn("Firestore cache unavailable, fetching from Places API:", firebaseErr);
      const places = await fetchAndMergePlaces(lat, lng, radiusMeters);
      return NextResponse.json({ places });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Places API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
