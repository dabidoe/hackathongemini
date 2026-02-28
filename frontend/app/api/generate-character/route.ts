import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prompt = typeof body?.prompt === "string" ? body.prompt : ""
    const description = typeof body?.description === "string" ? body.description : ""

    if (!prompt && !description) {
      return NextResponse.json(
        { error: "Missing prompt or description" },
        { status: 400 }
      )
    }

    const textForSeed = (prompt || description).slice(0, 100)
    const mockImageUrl = `https://picsum.photos/seed/${encodeURIComponent(textForSeed)}/400/533`

    return NextResponse.json({
      success: true,
      imageUrl: mockImageUrl,
      prompt: prompt || description,
      message: "Character portrait generated successfully",
    })
  } catch (error) {
    console.error("Character generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate character portrait",
        message: "Please try again",
      },
      { status: 500 }
    )
  }
}
