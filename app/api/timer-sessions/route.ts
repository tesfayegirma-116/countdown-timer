import { type NextRequest, NextResponse } from "next/server"
import { saveTimerSession, getTimerSessions } from "@/lib/database"

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
