"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { BOUNDING_RADIUS_METERS } from "@/lib/geo"
import { useMapContextOptional } from "@/contexts/map-context"
import type { PlaceResult } from "@/app/api/places/route"

const MAX_HOTSPOTS = 200 // Cap accumulated markers so map stays performant
const CENTER_GRID = 3 // Decimal places for "same area" (~111m) to avoid duplicate fetches

interface GoogleMapLayerProps {
  onMapReady?: (map: google.maps.Map) => void
}

function mergePlaces(existing: PlaceResult[], incoming: PlaceResult[], max: number): PlaceResult[] {
  const byId = new Map<string, PlaceResult>()
  for (const p of existing) byId.set(p.place_id, p)
  for (const p of incoming) byId.set(p.place_id, p)
  return Array.from(byId.values()).slice(0, max)
}

export function GoogleMapLayer({ onMapReady }: GoogleMapLayerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const ctx = useMapContextOptional()
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const playerPos = ctx?.playerPos ?? { lat: 40.758, lng: -73.9855 }
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const lastFetchedCenterRef = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const c = ctxRef.current
    if (!c || !mapRef.current || !mapsLoaded || typeof google === "undefined") return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    const center = { lat: playerPos.lat, lng: playerPos.lng }
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      minZoom: 9,
      maxZoom: 21,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      disableDefaultUI: true,
      gestureHandling: "greedy",
    })

    mapInstanceRef.current = map
    c.setMap(map)

    const updateBounds = () => {
      const b = map.getBounds()
      ctxRef.current?.setBounds(b ?? null)
    }

    const onIdle = () => {
      updateBounds()
      ctxRef.current?.setIsMapIdle(true)
    }

    map.addListener("idle", onIdle)
    map.addListener("dragstart", () => ctxRef.current?.setIsMapIdle(false))
    map.addListener("zoom_changed", () => ctxRef.current?.setIsMapIdle(false))
    updateBounds()

    onMapReady?.(map)

    return () => {
      mapInstanceRef.current = null
      ctxRef.current?.setMap(null)
      ctxRef.current?.setBounds(null)
    }
  }, [mapsLoaded])

  useEffect(() => {
    if (!mapInstanceRef.current || !ctxRef.current) return
    mapInstanceRef.current.setCenter({ lat: playerPos.lat, lng: playerPos.lng })
  }, [playerPos.lat, playerPos.lng])

  // Initial load and when player position changes: fetch and set (or merge with existing)
  useEffect(() => {
    if (!mapsLoaded || !ctxRef.current) return

    lastFetchedCenterRef.current = {
      lat: Math.round(playerPos.lat * 10 ** CENTER_GRID) / 10 ** CENTER_GRID,
      lng: Math.round(playerPos.lng * 10 ** CENTER_GRID) / 10 ** CENTER_GRID,
    }
    const url = `/api/places?lat=${playerPos.lat}&lng=${playerPos.lng}&radiusMeters=${BOUNDING_RADIUS_METERS}`
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        const places = data.places ?? []
        const existing = ctxRef.current?.hotspots ?? []
        const merged = mergePlaces(existing, places, MAX_HOTSPOTS)
        ctxRef.current?.setHotspots(merged)
      })
      .catch(() => {
        ctxRef.current?.setHotspots([])
      })
  }, [mapsLoaded, playerPos.lat, playerPos.lng])

  // When map is idle and viewport center changes: fetch for visible center and merge into hotspots (fills Firebase cache + map)
  const bounds = ctx?.bounds ?? null
  const isMapIdle = ctx?.isMapIdle ?? true
  const centerKey =
    mapsLoaded && isMapIdle && bounds
      ? `${Math.round(bounds.getCenter().lat() * 10 ** CENTER_GRID)}_${Math.round(bounds.getCenter().lng() * 10 ** CENTER_GRID)}`
      : null

  useEffect(() => {
    if (!mapsLoaded || !ctxRef.current || !centerKey) return

    const [latR, lngR] = centerKey.split("_").map(Number)
    const lat = latR / 10 ** CENTER_GRID
    const lng = lngR / 10 ** CENTER_GRID
    const prev = lastFetchedCenterRef.current
    if (prev && prev.lat === lat && prev.lng === lng) return

    const url = `/api/places?lat=${lat}&lng=${lng}&radiusMeters=${BOUNDING_RADIUS_METERS}`
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        const places = data.places ?? []
        const existing = ctxRef.current?.hotspots ?? []
        const merged = mergePlaces(existing, places, MAX_HOTSPOTS)
        ctxRef.current?.setHotspots(merged)
        lastFetchedCenterRef.current = { lat, lng }
      })
      .catch(() => {})
  }, [mapsLoaded, centerKey])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background text-destructive">
        <p className="text-sm">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set</p>
      </div>
    )
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}`}
        strategy="afterInteractive"
        onLoad={() => setMapsLoaded(true)}
      />
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />
    </>
  )
}
