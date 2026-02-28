"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { NYC_FALLBACK, BOUNDING_RADIUS_METERS } from "@/lib/geo"
import { useMapContextOptional } from "@/contexts/map-context"

interface GoogleMapLayerProps {
  onMapReady?: (map: google.maps.Map) => void
}

export function GoogleMapLayer({ onMapReady }: GoogleMapLayerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const ctx = useMapContextOptional()
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx
  const [mapsLoaded, setMapsLoaded] = useState(false)

  useEffect(() => {
    const c = ctxRef.current
    if (!c || !mapRef.current || !mapsLoaded || typeof google === "undefined") return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    const center = { lat: NYC_FALLBACK.lat, lng: NYC_FALLBACK.lng }
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      minZoom: 9,
      maxZoom: 21,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      disableDefaultUI: true,
      gestureHandling: "greedy",
    })

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
      ctxRef.current?.setMap(null)
      ctxRef.current?.setBounds(null)
    }
  }, [mapsLoaded])

  useEffect(() => {
    if (!mapsLoaded || !ctxRef.current) return

    const url = `/api/places?lat=${NYC_FALLBACK.lat}&lng=${NYC_FALLBACK.lng}&radiusMeters=${BOUNDING_RADIUS_METERS}`
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        ctxRef.current?.setHotspots(data.places ?? [])
      })
      .catch(() => {
        ctxRef.current?.setHotspots([])
      })
  }, [mapsLoaded])

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
