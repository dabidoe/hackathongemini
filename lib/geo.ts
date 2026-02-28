/**
 * Geo utilities for the location-based map game.
 * Bounding box computation, Haversine distance, and constants.
 */

/** NYC center fallback when geolocation is denied/unavailable */
export const NYC_FALLBACK = { lat: 40.758, lng: -73.9855 } as const;

/** Distance in meters within which user is "near" a hotspot (enables Start encounter) */
export const PROXIMITY_METERS = 75;

/** Default radius in miles (1 mile = initial zoom) */
export const BOUNDING_RADIUS_MILES = 1;

/** ~1 mile in meters */
export const BOUNDING_RADIUS_METERS = 1609;

/** Max zoom-out radius in miles */
export const MAX_RADIUS_MILES = 15;

/** ~15 miles in meters */
export const MAX_RADIUS_METERS = 24140;

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Compute a square bounding box around a center point given a radius in miles.
 * Uses Earth radius and latitude adjustment for longitude (cos(lat)).
 */
export function getBoundingBox(
  lat: number,
  lng: number,
  radiusMiles: number = BOUNDING_RADIUS_MILES
): BoundingBox {
  const radiusKm = radiusMiles * 1.60934;
  const deltaLat = radiusKm / 111.32;
  const latRad = (lat * Math.PI) / 180;
  const deltaLng = radiusKm / (111.32 * Math.cos(latRad));

  return {
    north: lat + deltaLat,
    south: lat - deltaLat,
    east: lng + deltaLng,
    west: lng - deltaLng,
  };
}

/**
 * Haversine formula: distance in meters between two lat/lng points.
 * No external libs; uses Earth radius ~6371 km.
 */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Convert meters to miles */
export function metersToMiles(m: number): number {
  return m / 1609.34;
}

/**
 * Compute radius in meters from center to edge of bounds.
 * Returns max distance from center to any corner, capped at MAX_RADIUS_METERS.
 */
export function getRadiusFromBounds(
  centerLat: number,
  centerLng: number,
  north: number,
  south: number,
  east: number,
  west: number
): number {
  const corners = [
    [north, east],
    [north, west],
    [south, east],
    [south, west],
  ];
  let maxMeters = 0;
  for (const [lat, lng] of corners) {
    const d = haversineMeters(centerLat, centerLng, lat, lng);
    if (d > maxMeters) maxMeters = d;
  }
  return Math.min(maxMeters, MAX_RADIUS_METERS);
}
