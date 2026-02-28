/**
 * Map theme styles for Fantasy and Cyberpunk.
 * Google Maps JSON styling + CSS overlay config.
 */

export type MapTheme = "fantasy" | "cyberpunk";

/** MapTypeStyle format for Google Maps setOptions({ styles }) */
interface MapStyleRule {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string | number>>;
}

/** Fantasy: warm earth tones, muted greens, soft amber roads */
const FANTASY_STYLES: MapStyleRule[] = [
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#a3d5d6" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#e8e0d0" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#d4b896" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#c9a86c" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#b8956a" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#b8d4a8" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e0d8c8" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#c9b896" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#e8e0d0" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6b5d4a" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#5c4d3a" }] },
];

/** Cyberpunk: dark base, neon cyan/magenta accents */
const CYBERPUNK_STYLES: MapStyleRule[] = [
  { featureType: "all", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f3460" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#16213e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a4a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#00d9ff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e94560" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0f3460" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#00d9ff" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#16213e" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#00d9ff" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#e94560" }] },
];

/**
 * Get Google Maps JSON styles for the given theme.
 */
export function getMapStyles(theme: MapTheme): MapStyleRule[] {
  return theme === "cyberpunk" ? CYBERPUNK_STYLES : FANTASY_STYLES;
}

export interface OverlayConfig {
  className: string;
  style?: React.CSSProperties;
}

/**
 * Get CSS overlay config for the theme.
 * Theme visuals live in globals.css (opacity tints; blend-mode via @supports).
 */
export function getOverlayConfig(theme: MapTheme): OverlayConfig {
  const base = "map-overlay";
  const themeClass = theme === "cyberpunk" ? "map-overlay-cyberpunk" : "map-overlay-fantasy";
  return {
    className: `${base} ${themeClass}`,
  };
}
