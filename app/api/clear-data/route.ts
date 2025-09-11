import { NextResponse } from "next/server"
import { clearAllTimerSessions } from "@/lib/database"

export async function DELETE() {
    try {
        const deletedCount = clearAllTimerSessions()

        return NextResponse.json({
            success: true,
            message: `Successfully cleared ${deletedCount} timer sessions`,
            deletedCount
        })
    } catch (error) {
        console.error("Error clearing timer sessions:", error)
        return NextResponse.json(
            { success: false, error: "Failed to clear timer sessions" },
            { status: 500 }
        )
    }
}