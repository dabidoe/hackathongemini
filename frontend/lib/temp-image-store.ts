/**
 * In-memory store for temporary uploaded images when Firebase is not configured.
 * Used so profile photo upload + Nano Banana generation still works without Firebase.
 */

const store = new Map<
  string,
  { buffer: Buffer; contentType: string; createdAt: number }
>()
const TTL_MS = 15 * 60 * 1000 // 15 minutes

export function saveTempImage(id: string, buffer: Buffer, contentType: string): void {
  store.set(id, { buffer, contentType, createdAt: Date.now() })
}

export function getTempImage(id: string): { buffer: Buffer; contentType: string } | null {
  const entry = store.get(id)
  if (!entry) return null
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(id)
    return null
  }
  return { buffer: entry.buffer, contentType: entry.contentType }
}

export function createTempId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}
