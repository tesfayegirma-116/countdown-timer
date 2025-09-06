"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, History, Clock, Timer, Calendar, Trash2, AlertTriangle, CheckCircle, Target, Zap } from "lucide-react"
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
  const [deletingId, setDeletingId] = useState<number | null>(null)

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

  const deleteSession = async (sessionId: number, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent card selection

    if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      return
    }

    try {
      setDeletingId(sessionId)
      const response = await fetch(`/api/timer-sessions?id=${sessionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSessions(sessions.filter(session => session.id !== sessionId))
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null)
        }
      } else {
        console.error("Failed to delete session")
        alert("Failed to delete session. Please try again.")
      }
    } catch (error) {
      console.error("Error deleting session:", error)
      alert("Failed to delete session. Please try again.")
    } finally {
      setDeletingId(null)
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

  // Get session status and tags
  const getSessionStatus = (session: TimerSession) => {
    const completionRate = (session.actual_duration / session.target_duration) * 100
    const wasInLastMinutes = session.actual_duration >= (session.target_duration - 300) && session.actual_duration < session.target_duration

    return {
      hasOvertime: session.extra_time > 0,
      wasInLastMinutes,
      isCompleted: session.actual_duration >= session.target_duration,
      completionRate: Math.round(completionRate),
      isEarlyStop: session.actual_duration < session.target_duration && session.extra_time === 0
    }
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

  // Calculate stats
  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.actual_duration >= s.target_duration).length
  const overtimeSessions = sessions.filter(s => s.extra_time > 0).length

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
          <div className="p-6 border-b border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-stone-600" />
                <h2 className="text-lg font-semibold text-stone-800">Session History</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-stone-500 hover:text-stone-700">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Stats */}
            {totalSessions > 0 && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-blue-600">{totalSessions}</div>
                  <div className="text-xs text-blue-500">Total</div>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-green-600">{completedSessions}</div>
                  <div className="text-xs text-green-500">Completed</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-amber-600">{overtimeSessions}</div>
                  <div className="text-xs text-amber-500">Overtime</div>
                </div>
              </div>
            )}
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
                <div className="font-medium">No sessions yet</div>
                <div className="text-sm">Start your first timer to see history!</div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {Object.entries(groupedSessions).map(([date, dateSessions]) => (
                    <div key={date}>
                      {/* Date Header */}
                      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-stone-600 sticky top-0 bg-white/90 backdrop-blur-sm py-2 -mx-2 px-2 rounded-lg">
                        <Calendar className="w-4 h-4" />
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                        <span className="text-xs text-stone-400">({dateSessions.length} sessions)</span>
                      </div>

                      {/* Sessions for this date */}
                      <div className="space-y-3 mb-6">
                        {dateSessions.map((session) => {
                          const status = getSessionStatus(session)
                          return (
                            <Card
                              key={session.id}
                              className={cn(
                                "p-4 cursor-pointer transition-all hover:shadow-md border-stone-200 relative group",
                                selectedSession?.id === session.id ? "ring-2 ring-blue-300 bg-blue-50/50" : "bg-white/80 hover:bg-white",
                                status.hasOvertime && "border-l-4 border-l-red-400",
                                status.wasInLastMinutes && !status.hasOvertime && "border-l-4 border-l-amber-400",
                                status.isCompleted && !status.hasOvertime && !status.wasInLastMinutes && "border-l-4 border-l-green-400",
                                status.isEarlyStop && "border-l-4 border-l-gray-400"
                              )}
                              onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                            >
                              {/* Delete Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => deleteSession(session.id, e)}
                                disabled={deletingId === session.id}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 w-8 h-8 p-0"
                              >
                                {deletingId === session.id ? (
                                  <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </Button>

                              <div className="space-y-3 pr-8">
                                {/* Session Name & Time */}
                                <div className="flex items-start justify-between">
                                  <div className="font-medium text-stone-800 truncate pr-2">{session.session_name}</div>
                                  <div className="text-xs text-stone-500 whitespace-nowrap">{formatDate(session.completed_at)}</div>
                                </div>

                                {/* Status Tags */}
                                <div className="flex flex-wrap gap-1">
                                  {status.hasOvertime && (
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                      <Zap className="w-3 h-3" />
                                      Overtime +{formatDuration(session.extra_time)}
                                    </div>
                                  )}
                                  {status.wasInLastMinutes && !status.hasOvertime && (
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                                      <AlertTriangle className="w-3 h-3" />
                                      Last Minutes
                                    </div>
                                  )}
                                  {status.isCompleted && !status.hasOvertime && !status.wasInLastMinutes && (
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                      <CheckCircle className="w-3 h-3" />
                                      Completed
                                    </div>
                                  )}
                                  {status.isEarlyStop && (
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                                      <Target className="w-3 h-3" />
                                      Early Stop
                                    </div>
                                  )}
                                </div>

                                {/* Duration Info */}
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1 text-stone-600">
                                    <Clock className="w-3 h-3" />
                                    <span className="font-medium">Target:</span> {formatDuration(session.target_duration)}
                                  </div>
                                  <div className="flex items-center gap-1 text-stone-600">
                                    <Timer className="w-3 h-3" />
                                    <span className="font-medium">Actual:</span> {formatDuration(session.actual_duration)}
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-stone-500">
                                    <span>Progress</span>
                                    <span>{status.completionRate}%</span>
                                  </div>
                                  <div className="w-full bg-stone-200 rounded-full h-2">
                                    <div
                                      className={cn(
                                        "h-2 rounded-full transition-all",
                                        status.hasOvertime ? "bg-red-500" :
                                          status.wasInLastMinutes ? "bg-amber-500" :
                                            status.isCompleted ? "bg-green-500" : "bg-gray-400"
                                      )}
                                      style={{ width: `${Math.min(status.completionRate, 100)}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Expanded Details */}
                                {selectedSession?.id === session.id && (
                                  <div className="mt-4 pt-3 border-t border-stone-200 space-y-3 text-sm">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-stone-50 rounded-lg p-2">
                                        <div className="font-medium text-stone-700">Session Duration</div>
                                        <div className="text-stone-600">{formatDuration(session.actual_duration)}</div>
                                      </div>
                                      <div className="bg-stone-50 rounded-lg p-2">
                                        <div className="font-medium text-stone-700">Year</div>
                                        <div className="text-stone-600">{session.session_year}</div>
                                      </div>
                                    </div>

                                    {status.hasOvertime && (
                                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                        <div className="font-medium text-red-800 mb-1">Overtime Details</div>
                                        <div className="text-red-700 text-sm">
                                          You went {formatDuration(session.extra_time)} over your target time.
                                          Total session time was {formatDuration(session.actual_duration)}.
                                        </div>
                                      </div>
                                    )}

                                    {status.isEarlyStop && (
                                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <div className="font-medium text-gray-800 mb-1">Early Stop</div>
                                        <div className="text-gray-700 text-sm">
                                          Session ended {formatDuration(session.target_duration - session.actual_duration)} before target time.
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </Card>
                          )
                        })}
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
