"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { PlaceResult } from "@/app/api/places/route"

interface MapContextValue {
  map: google.maps.Map | null
  bounds: google.maps.LatLngBounds | null
  hotspots: PlaceResult[]
  playerPos: { lat: number; lng: number }
  isMapIdle: boolean
  setMap: (map: google.maps.Map | null) => void
  setBounds: (bounds: google.maps.LatLngBounds | null) => void
  setHotspots: (hotspots: PlaceResult[]) => void
  setIsMapIdle: (idle: boolean) => void
}

const MapContext = createContext<MapContextValue | null>(null)

export function MapProvider({ children, playerPos }: { children: ReactNode; playerPos: { lat: number; lng: number } }) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null)
  const [hotspots, setHotspots] = useState<PlaceResult[]>([])
  const [isMapIdle, setIsMapIdle] = useState(true)

  return (
    <MapContext.Provider
      value={{
        map,
        bounds,
        hotspots,
        playerPos,
        isMapIdle,
        setMap,
        setBounds,
        setHotspots,
        setIsMapIdle,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export function useMapContext() {
  const ctx = useContext(MapContext)
  if (!ctx) {
    throw new Error("useMapContext must be used within MapProvider")
  }
  return ctx
}

export function useMapContextOptional() {
  return useContext(MapContext)
}
