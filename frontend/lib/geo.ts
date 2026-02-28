/**
 * Geo utilities for map and hotspot positioning.
 */

/** NYC center fallback */
export const NYC_FALLBACK = { lat: 40.758, lng: -73.9855 } as const;

export const PROXIMITY_METERS = 75;
export const BOUNDING_RADIUS_MILES = 1;
export const BOUNDING_RADIUS_METERS = 1609;
export const MAX_RADIUS_MILES = 15;
export const MAX_RADIUS_METERS = 24140;

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

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

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
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
