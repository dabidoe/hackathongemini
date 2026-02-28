/**
 * Maps Google Places location names to background images.
 * Images live in /backgrounds/ (public folder) or Firebase Storage URLs.
 * Match is case-insensitive and uses substring (e.g. "bryant park" matches "Bryant Park").
 */

const IMAGE_BASE = "/backgrounds"

/** Place name patterns (lowercase) -> image filename. First match wins. */
const LOCATION_IMAGE_MAP: [string, string][] = [
  // User-specified mappings
  ["rockefeller", "fantasy-roc.png"], // The church / Rockefeller Center
  ["rockefeller center", "fantasy-roc.png"],
  ["bryant park", "cyber-flatironbuilding.png"], // Bryant Park
  ["flatiron", "cyberpunk-bryantpark.png"], // Flatiron Building
  ["times square", "timessquarecyber.png"],
  ["union square", "unionsquarefantasy.png"],
  // Additional locations from image set
  ["madison square garden", "fantasy-msg.png"],
  ["msg", "fantasy-msg2.png"],
  ["carnegie hall", "fantasy-carnegie.png"],
  ["carnegie", "cyber-carnegie.png"],
  ["empire state", "fantasy-empirestate.png"],
  ["st. bartholomew", "fantasy-stbarts.png"],
  ["st bartholomew", "fantasy-stbarts.png"],
  ["central park", "fantasy-centralpark.png"],
  ["herald square", "cyber-herald.png"],
  ["moma", "cyber-moma2.png"],
  ["museum of modern art", "cyber-moma2.png"],
]

/**
 * Get background image URL for a place. Returns path for local images.
 * For Firebase URLs (from DB), returns the full URL as-is.
 */
export function getLocationImageUrl(placeName: string, placeId?: string): string {
  const name = (placeName || "").toLowerCase()
  for (const [pattern, filename] of LOCATION_IMAGE_MAP) {
    if (name.includes(pattern)) {
      return `${IMAGE_BASE}/${filename}`
    }
  }
  // Fallback - no match
  return ""
}
