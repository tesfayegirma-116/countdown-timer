import { type NextRequest, NextResponse } from "next/server"
import { saveTimerSession, getTimerSessions, deleteTimerSession } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_name, target_duration, actual_duration, extra_time } = body

    const sessionId = saveTimerSession({
      session_name,
      target_duration,
      actual_duration,
      extra_time,
    })

    return NextResponse.json({ success: true, sessionId })
  } catch (error) {
    console.error("Error saving timer session:", error)
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const sessions = getTimerSessions()
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Error fetching timer sessions:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const success = deleteTimerSession(parseInt(id))

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error deleting timer session:", error)
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
  }
}
