"use client"

import { useState } from "react"
import { MapPin, Navigation, Clock, Users } from "lucide-react"
import Image from "next/image"

interface Location {
  id: string
  name: string
  type: string
  imageUrl: string
  distance: number
  visitorsToday?: number
  lastVisited?: string
}

interface LocationDisplayProps {
  location: Location
  onLocationChange?: (direction: "prev" | "next") => void
}

export function LocationDisplay({ location, onLocationChange }: LocationDisplayProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <div className="relative w-full h-full">
      {/* Location Image */}
      <div className="absolute inset-0">
        {!imageError ? (
          <Image
            src={location.imageUrl}
            alt={location.name}
            fill
            className={`object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-background flex items-center justify-center">
            <MapPin className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-transparent" />
      </div>

      {/* Location Info Overlay - Top */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 backdrop-blur-md border border-border">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono text-primary uppercase">{location.type}</span>
        </div>
      </div>

      {/* Location Details - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <div className="space-y-2">
          <h2 className="text-xl font-mono font-bold text-foreground">{location.name}</h2>
          
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              <span>{location.distance}m away</span>
            </div>
            {location.visitorsToday && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{location.visitorsToday} today</span>
              </div>
            )}
            {location.lastVisited && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{location.lastVisited}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Swipe indicators */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
        <button 
          onClick={() => onLocationChange?.("prev")}
          className="w-8 h-8 rounded-full bg-background/40 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
        >
          <span className="text-sm">&lt;</span>
        </button>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
        <button 
          onClick={() => onLocationChange?.("next")}
          className="w-8 h-8 rounded-full bg-background/40 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
        >
          <span className="text-sm">&gt;</span>
        </button>
      </div>
    </div>
  )
}
