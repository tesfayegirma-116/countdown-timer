"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, History, Clock, Timer, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimerSession {
  id: number
  session_name: string
  target_duration: number
  actual_duration: number
  extra_time: number
  session_date: string
  session_year: number
  completed_at: string
}

interface SessionHistorySidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function SessionHistorySidebar({ isOpen, onClose }: SessionHistorySidebarProps) {
  const [sessions, setSessions] = useState<TimerSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<TimerSession | null>(null)

  // Load sessions when sidebar opens
  useEffect(() => {
    if (isOpen) {
      loadSessions()
    }
  }, [isOpen])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/timer-sessions")
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error("Failed to load sessions:", error)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  // Format duration helper
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Group sessions by date
  const groupedSessions = sessions.reduce(
    (groups, session) => {
      const date = session.session_date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(session)
      return groups
    },
    {} as Record<string, TimerSession[]>,
  )

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-96 bg-white/95 backdrop-blur-md border-l border-stone-200 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-stone-600" />
              <h2 className="text-lg font-semibold text-stone-800">Session History</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-stone-500 hover:text-stone-700">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-stone-500">Loading sessions...</div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-stone-500">
                <Timer className="w-8 h-8 mb-2 opacity-50" />
                <div>No sessions yet</div>
                <div className="text-sm">Start your first timer!</div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {Object.entries(groupedSessions).map(([date, dateSessions]) => (
                    <div key={date}>
                      {/* Date Header */}
                      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-stone-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>

                      {/* Sessions for this date */}
                      <div className="space-y-2 mb-6">
                        {dateSessions.map((session) => (
                          <Card
                            key={session.id}
                            className={cn(
                              "p-4 cursor-pointer transition-all hover:shadow-md border-stone-200",
                              selectedSession?.id === session.id ? "ring-2 ring-stone-300 bg-stone-50" : "bg-white/80",
                            )}
                            onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                          >
                            <div className="space-y-2">
                              {/* Session Name & Time */}
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-stone-800 truncate">{session.session_name}</div>
                                <div className="text-xs text-stone-500">{formatDate(session.completed_at)}</div>
                              </div>

                              {/* Duration Info */}
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-stone-600">
                                  <Clock className="w-3 h-3" />
                                  Target: {formatDuration(session.target_duration)}
                                </div>
                                <div className="flex items-center gap-1 text-stone-600">
                                  <Timer className="w-3 h-3" />
                                  Actual: {formatDuration(session.actual_duration)}
                                </div>
                              </div>

                              {/* Extra Time Badge */}
                              {session.extra_time > 0 && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                                  +{formatDuration(session.extra_time)} overtime
                                </div>
                              )}

                              {/* Expanded Details */}
                              {selectedSession?.id === session.id && (
                                <div className="mt-3 pt-3 border-t border-stone-200 space-y-2 text-sm text-stone-600">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <div className="font-medium">Completion Rate</div>
                                      <div>
                                        {session.extra_time > 0
                                          ? `${Math.round((session.target_duration / session.actual_duration) * 100)}%`
                                          : session.actual_duration >= session.target_duration
                                            ? "100%"
                                            : `${Math.round((session.actual_duration / session.target_duration) * 100)}%`}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="font-medium">Session Year</div>
                                      <div>{session.session_year}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
