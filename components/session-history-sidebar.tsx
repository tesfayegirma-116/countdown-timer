"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, History, Clock, Timer, Calendar, Trash2, AlertTriangle, CheckCircle, Target, Zap, Filter, Search, TrendingUp, Award, BarChart3 } from "lucide-react"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "custom">("all")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)

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

  // Filter sessions based on date filters
  const filteredSessions = sessions.filter(session => {
    // Date filter
    const sessionDate = new Date(session.session_date)
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    let matchesDate = true
    switch (dateFilter) {
      case "today":
        matchesDate = sessionDate >= startOfToday
        break
      case "week":
        matchesDate = sessionDate >= startOfWeek
        break
      case "month":
        matchesDate = sessionDate >= startOfMonth
        break
      case "custom":
        if (customDateFrom && customDateTo) {
          const fromDate = new Date(customDateFrom)
          const toDate = new Date(customDateTo)
          toDate.setHours(23, 59, 59, 999) // Include the entire end date
          matchesDate = sessionDate >= fromDate && sessionDate <= toDate
        }
        break
      default:
        matchesDate = true
    }

    return matchesDate
  })

  // Group filtered sessions by date with better categorization
  const groupedSessions = filteredSessions.reduce(
    (groups, session) => {
      const sessionDate = new Date(session.session_date)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)

      let dateKey: string
      let displayDate: string

      if (sessionDate.toDateString() === today.toDateString()) {
        dateKey = "today"
        displayDate = "Today"
      } else if (sessionDate.toDateString() === yesterday.toDateString()) {
        dateKey = "yesterday"
        displayDate = "Yesterday"
      } else {
        const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff <= 7) {
          dateKey = `week-${session.session_date}`
          displayDate = sessionDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
        } else if (daysDiff <= 30) {
          dateKey = `month-${session.session_date}`
          displayDate = sessionDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
        } else {
          dateKey = session.session_date
          displayDate = sessionDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: sessionDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
            month: "long",
            day: "numeric"
          })
        }
      }

      if (!groups[dateKey]) {
        groups[dateKey] = { displayDate, sessions: [] }
      }
      groups[dateKey].sessions.push(session)
      return groups
    },
    {} as Record<string, { displayDate: string; sessions: TimerSession[] }>,
  )

  // Sort groups by date (most recent first)
  const sortedGroupKeys = Object.keys(groupedSessions).sort((a, b) => {
    if (a === "today") return -1
    if (b === "today") return 1
    if (a === "yesterday") return -1
    if (b === "yesterday") return 1

    const dateA = groupedSessions[a].sessions[0]?.session_date || ""
    const dateB = groupedSessions[b].sessions[0]?.session_date || ""
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })

  // Calculate stats for filtered sessions
  const totalSessions = filteredSessions.length
  const completedSessions = filteredSessions.filter(s => s.actual_duration >= s.target_duration && s.extra_time === 0).length
  const warningTimeSessions = filteredSessions.filter(s => {
    const wasInLastMinutes = s.actual_duration >= (s.target_duration - 300) && s.actual_duration < s.target_duration
    return wasInLastMinutes && s.extra_time === 0
  }).length
  const overtimeSessions = filteredSessions.filter(s => s.extra_time > 0).length
  const totalWastedTime = filteredSessions.reduce((sum, s) => sum + s.extra_time, 0)

  // Format time helper for readable display
  const formatReadableTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[400px] md:w-[480px] lg:w-[520px] bg-background border-l border-border shadow-lg z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Session History</h2>
                <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">Track your focus sessions</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
              {/* Filter Toggle */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-sm"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                  <span className="sm:hidden">Filter</span>
                  {dateFilter !== "all" && (
                    <span className="ml-2 w-2 h-2 bg-primary rounded-full"></span>
                  )}
                </Button>

                {dateFilter !== "all" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFilter("all")
                      setCustomDateFrom("")
                      setCustomDateTo("")
                    }}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Filter Options */}
              {showFilters && (
                <div className="space-y-4 p-3 sm:p-4 bg-muted/50 rounded-lg border">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Time Period</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "all", label: "All" },
                        { value: "today", label: "Today" },
                        { value: "week", label: "Week" },
                        { value: "month", label: "Month" },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          variant={dateFilter === option.value ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setDateFilter(option.value as any)}
                          className="text-xs h-8"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant={dateFilter === "custom" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setDateFilter("custom")}
                      className="w-full mt-2 text-xs h-8"
                    >
                      Custom
                    </Button>

                    {dateFilter === "custom" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                        <div>
                          <Label className="text-xs mb-1 block">From</Label>
                          <Input
                            type="date"
                            value={customDateFrom}
                            onChange={(e) => setCustomDateFrom(e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">To</Label>
                          <Input
                            type="date"
                            value={customDateTo}
                            onChange={(e) => setCustomDateTo(e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Responsive Stats */}
            {totalSessions > 0 && (
              <div className="grid grid-cols-4 sm:flex sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 sm:mb-6 text-sm">
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{totalSessions}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-green-600">{completedSessions}</div>
                  <div className="text-xs text-green-500">Done</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-yellow-600">{warningTimeSessions}</div>
                  <div className="text-xs text-yellow-500">Close</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-red-600">{overtimeSessions}</div>
                  <div className="text-xs text-red-500">Over</div>
                </div>
                {totalWastedTime > 0 && (
                  <div className="text-center col-span-4 sm:col-span-1 mt-2 sm:mt-0">
                    <div className="text-lg sm:text-xl font-bold text-red-600">{formatReadableTime(totalWastedTime)}</div>
                    <div className="text-xs text-red-500">Wasted</div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-500"></div>
                <div className="ml-3 text-gray-600 text-sm">Loading...</div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-8">
                <Timer className="w-10 h-10 text-muted-foreground/50 mb-3" />
                <div className="font-medium text-foreground mb-1">No sessions yet</div>
                <div className="text-sm text-center text-muted-foreground max-w-xs">
                  Start your first focus session to begin tracking
                </div>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-8">
                <Filter className="w-10 h-10 text-muted-foreground/50 mb-3" />
                <div className="font-medium text-foreground mb-1">No matching sessions</div>
                <div className="text-sm text-center text-muted-foreground max-w-xs">
                  Try adjusting your date filters
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="px-4 sm:px-6 py-4 space-y-6 sm:space-y-8">
                  {sortedGroupKeys.map((dateKey) => {
                    const group = groupedSessions[dateKey]
                    return (
                      <div key={dateKey} className="space-y-5">
                        {/* Date Header */}
                        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-4 bg-primary rounded-full"></div>
                              <div>
                                <div className="font-medium text-foreground text-sm">{group.displayDate}</div>
                                <div className="text-xs text-muted-foreground">
                                  {group.sessions.length} session{group.sessions.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round((group.sessions.filter(s => s.actual_duration >= s.target_duration).length / group.sessions.length) * 100)}%
                            </div>
                          </div>
                        </div>

                        {/* Sessions for this date */}
                        <div className="space-y-2 sm:space-y-3">
                          {group.sessions.map((session) => {
                            const status = getSessionStatus(session)
                            return (
                              <Card
                                key={session.id}
                                className={cn(
                                  "p-4 cursor-pointer transition-all duration-200 hover:shadow-sm relative group",
                                  selectedSession?.id === session.id ? "ring-1 ring-ring bg-accent/50" : "",
                                  status.hasOvertime && "border-l-2 border-l-destructive",
                                  status.wasInLastMinutes && !status.hasOvertime && "border-l-2 border-l-yellow-500",
                                  status.isCompleted && !status.hasOvertime && !status.wasInLastMinutes && "border-l-2 border-l-green-500",
                                  status.isEarlyStop && "border-l-2 border-l-muted-foreground"
                                )}
                                onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                              >
                                {/* Delete Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => deleteSession(session.id, e)}
                                  disabled={deletingId === session.id}
                                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 hover:bg-red-50 w-6 h-6 p-0 rounded-md"
                                >
                                  {deletingId === session.id ? (
                                    <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </Button>

                                <div className="space-y-3 pr-6 sm:pr-8">
                                  {/* Goal */}
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium text-foreground">
                                      Goal: {formatDuration(session.target_duration)}
                                    </div>
                                  </div>

                                  {/* Ended Date */}
                                  <div className="text-xs text-muted-foreground">
                                    Ended: {formatDate(session.completed_at)}
                                  </div>

                                  {/* Category */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Category:</span>
                                    {status.hasOvertime && (
                                      <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md font-medium">
                                        Overtime (+{formatDuration(session.extra_time)})
                                      </div>
                                    )}
                                    {status.wasInLastMinutes && !status.hasOvertime && (
                                      <div className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-md font-medium">
                                        Warning Time
                                      </div>
                                    )}
                                    {status.isCompleted && !status.hasOvertime && !status.wasInLastMinutes && (
                                      <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md font-medium">
                                        Completed
                                      </div>
                                    )}
                                    {status.isEarlyStop && (
                                      <div className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                                        Early Stop
                                      </div>
                                    )}
                                  </div>

                                  {/* Expanded Details */}
                                  {selectedSession?.id === session.id && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Actual Duration:</span>
                                        <span className="font-medium">{formatDuration(session.actual_duration)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Completion Rate:</span>
                                        <span className="font-medium">{status.completionRate}%</span>
                                      </div>
                                      {status.hasOvertime && (
                                        <div className="flex justify-between text-red-600">
                                          <span>Extra Time:</span>
                                          <span className="font-medium">+{formatDuration(session.extra_time)}</span>
                                        </div>
                                      )}
                                      {status.isEarlyStop && (
                                        <div className="flex justify-between text-gray-600">
                                          <span>Stopped Early:</span>
                                          <span className="font-medium">-{formatDuration(session.target_duration - session.actual_duration)}</span>
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
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </>
  )
}