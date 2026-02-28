import { NextRequest, NextResponse } from "next/server"
import { getTempImage } from "@/lib/temp-image-store"

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }
  const entry = getTempImage(id)
  if (!entry) {
    return new NextResponse("Not found or expired", { status: 404 })
  }
  return new NextResponse(entry.buffer, {
    headers: {
      "Content-Type": entry.contentType,
      "Cache-Control": "private, max-age=60",
    },
  })
}
