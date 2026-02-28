/**
 * Loads characters from characters.json and provides deterministic random
 * assignment per location. Same placeId always gets the same 4 characters.
 */

export interface JsonCharacter {
  name: string
  class?: { $oid: string }
  race?: string | { $oid: string }
  background?: string | null
  alignment?: string
  icon?: string
  portrait?: string
  gallery?: string[]
  backstory?: string
  behaviors?: {
    personality_traits?: string[]
    speaking_style?: string
    greeting?: string
    quirks?: string[]
    motivations?: string[]
    conversation_starters?: string[]
  }
}

export interface CharacterMeta {
  name: string
  title: string
  avatarInitial: string
  imageUrl: string
}

/** Simple string hash for deterministic seeding */
function hashString(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    h = (h << 5) - h + c
    h = h & h
  }
  return Math.abs(h)
}

/** Deterministic shuffle: given seed, returns shuffled indices 0..n-1 */
function seededShuffle(n: number, seed: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    const j = seed % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

let charactersCache: JsonCharacter[] | null = null

export function getCharacters(): JsonCharacter[] {
  if (charactersCache) return charactersCache
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require("@/data/characters.json")
    charactersCache = Array.isArray(data) ? data : [data]
    return charactersCache
  } catch {
    charactersCache = []
    return []
  }
}

/** Convert JSON character to task meta format */
function toCharacterMeta(c: JsonCharacter, index: number): CharacterMeta {
  const name = c.name || `Character ${index + 1}`
  const initial = name.charAt(0).toUpperCase()
  const imageUrl =
    c.portrait || c.icon || (Array.isArray(c.gallery) && c.gallery[0]) || ""
  const race = typeof c.race === "string" ? c.race : ""
  const background = c.background || "Traveler"
  const title = race ? `${background} ${race}`.trim() : background

  return {
    name,
    title: title || "Adventurer",
    avatarInitial: initial,
    imageUrl: imageUrl || `/characters/placeholder-${(index % 4) + 1}.jpg`,
  }
}

/**
 * Get up to 8 characters for a location, deterministically assigned based on placeId.
 * Same placeId always returns the same characters. Used for 4 initial + 4 replacement slots.
 */
export function getCharactersForPlace(placeId: string, count = 8): CharacterMeta[] {
  const all = getCharacters()
  if (all.length === 0) {
    const defaults = [
      { name: "ZERO", title: "Information Broker", avatarInitial: "Z", imageUrl: "/characters/zero.jpg" },
      { name: "NOVA", title: "Tech Scavenger", avatarInitial: "N", imageUrl: "/characters/nova.jpg" },
      { name: "CIPHER", title: "Accessibility Scout", avatarInitial: "C", imageUrl: "/characters/cipher.jpg" },
      { name: "ECHO", title: "Street Historian", avatarInitial: "E", imageUrl: "/characters/echo.jpg" },
    ]
    return [...defaults, ...defaults].slice(0, count)
  }

  const seed = hashString(placeId)
  const shuffled = seededShuffle(all.length, seed)
  const indices = shuffled.slice(0, count)
  return indices.map((i) => toCharacterMeta(all[i], i))
}
