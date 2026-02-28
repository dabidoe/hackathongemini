"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import type { MapTheme } from "@/lib/mapStyles";
import { getOverlayConfig } from "@/lib/mapStyles";
import {
  NYC_FALLBACK,
  getBoundingBox,
  haversineMeters,
  PROXIMITY_METERS,
  MAX_RADIUS_MILES,
  MAX_RADIUS_METERS,
} from "@/lib/geo";
import type { PlaceResult } from "@/app/api/places/route";
import HUD from "./HUD";

interface MapViewProps {
  theme: MapTheme;
}

/**
 * Map container: player marker, bounding box, hotspot markers.
 * Rectangle = 15 miles around player (player-centric, not viewport).
 */
export default function MapView({ theme }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const playerPos = NYC_FALLBACK;
  const [hotspots, setHotspots] = useState<PlaceResult[]>([]);
  const [nearestHotspot, setNearestHotspot] = useState<PlaceResult | null>(null);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Compute nearest hotspot within 75m
  useEffect(() => {
    if (hotspots.length === 0) {
      setNearestHotspot(null);
      return;
    }

    let nearest: PlaceResult | null = null;
    let minDist = PROXIMITY_METERS;

    for (const h of hotspots) {
      const d = haversineMeters(playerPos.lat, playerPos.lng, h.lat, h.lng);
      if (d <= PROXIMITY_METERS && d < minDist) {
        minDist = d;
        nearest = h;
      }
    }

    setNearestHotspot(nearest);
  }, [playerPos, hotspots]);

  // Init map when script loaded
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || !apiKey) return;

    const center = { lat: playerPos.lat, lng: playerPos.lng };
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      minZoom: 11,
      maxZoom: 19,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    mapInstanceRef.current = map;

    const strokeColor = theme === "cyberpunk" ? "#00d9ff" : "#b8956a";
    const fillColor = theme === "cyberpunk" ? "#00d9ff" : "#d4b896";

    new google.maps.Rectangle({
      map,
      bounds: getBoundingBox(playerPos.lat, playerPos.lng, MAX_RADIUS_MILES),
      strokeColor,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor,
      fillOpacity: 0.05,
    });

    new google.maps.Marker({
      map,
      position: center,
      title: "You",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: theme === "cyberpunk" ? "#e94560" : "#8b4513",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2,
      },
    });

    const url = `/api/places?lat=${playerPos.lat}&lng=${playerPos.lng}&radiusMeters=${MAX_RADIUS_METERS}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setHotspots(data.places ?? []);
        setPlacesError(null);
      })
      .catch(() => {
        setPlacesError("Could not load hotspots");
        setHotspots([]);
      });

    return () => {
      mapInstanceRef.current = null;
    };
  }, [mapsLoaded, playerPos, theme, apiKey]);

  // Update hotspot markers when hotspots change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapsLoaded) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const infoWindow = new google.maps.InfoWindow();
    hotspots.forEach((place) => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: place.lat, lng: place.lng },
        title: place.name,
      });
      markersRef.current.push(marker);

      marker.addListener("click", () => {
        const content = `
          <div class="p-2 min-w-[160px]">
            <div class="font-semibold text-slate-800">${place.name}</div>
            ${place.rating != null ? `<div class="text-sm text-slate-600">★ ${place.rating} (${place.user_ratings_total ?? 0} reviews)</div>` : ""}
          </div>
        `;
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });
    });
  }, [hotspots, mapsLoaded]);

  const overlayConfig = getOverlayConfig(theme);

  if (!apiKey) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-red-400">
        <p>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set</p>
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}`}
        strategy="afterInteractive"
        onLoad={() => setMapsLoaded(true)}
      />

      <div className="relative h-screen w-full">
        <div ref={mapRef} className="h-full w-full" />

        {/* Theme overlay: pointer-events-none so map stays interactive */}
        <div
          className={`absolute inset-0 pointer-events-none ${overlayConfig.className}`}
          style={overlayConfig.style}
        />

        {placesError && (
          <div className="absolute left-4 top-4 rounded bg-red-900/90 px-3 py-2 text-sm text-red-200">
            {placesError}
          </div>
        )}

        <HUD
            theme={theme}
            playerPos={playerPos}
            hotspots={hotspots}
            nearestHotspot={nearestHotspot}
          />
      </div>
    </>
  );
}
