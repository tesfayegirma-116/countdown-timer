"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, Settings, Maximize, History, X, Clock } from "lucide-react"
import { SessionHistorySidebar } from "@/components/session-history-sidebar"
import { CustomTimeSetter } from "@/components/custom-time-setter"
import { cn } from "@/lib/utils"

interface TimerState {
  minutes: number
  seconds: number
  isRunning: boolean
  isOvertime: boolean
  targetDuration: number
  startTime: number | null
}

export default function CountdownTimer() {
  const [timer, setTimer] = useState<TimerState>({
    minutes: 25,
    seconds: 0,
    isRunning: false,
    isOvertime: false,
    targetDuration: 25 * 60,
    startTime: null,
  })

  const [showSettings, setShowSettings] = useState(false)
  const [showCustomTimer, setShowCustomTimer] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sessionName, setSessionName] = useState("Focus Session")
  const [showSidebar, setShowSidebar] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Format time display
  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Calculate total seconds
  const totalSeconds = timer.minutes * 60 + timer.seconds

  // Start/Stop timer
  const toggleTimer = () => {
    if (timer.isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setTimer((prev) => ({ ...prev, isRunning: false }))
    } else {
      setTimer((prev) => ({
        ...prev,
        isRunning: true,
        startTime: prev.startTime || Date.now(),
      }))
    }
  }

  // Reset timer
  const resetTimer = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Save session if timer was running or completed
    if (timer.startTime) {
      const actualDuration = Math.floor((Date.now() - timer.startTime) / 1000)
      const extraTime = timer.isOvertime ? totalSeconds : 0

      try {
        await fetch("/api/timer-sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_name: sessionName,
            target_duration: timer.targetDuration,
            actual_duration: actualDuration,
            extra_time: extraTime,
          }),
        })
      } catch (error) {
        console.error("Failed to save session:", error)
      }
    }

    setTimer({
      minutes: Math.floor(timer.targetDuration / 60),
      seconds: timer.targetDuration % 60,
      isRunning: false,
      isOvertime: false,
      targetDuration: timer.targetDuration,
      startTime: null,
    })
  }

  const setCustomTime = (minutes: number, seconds = 0) => {
    const newDuration = minutes * 60 + seconds
    setTimer({
      minutes,
      seconds,
      isRunning: false,
      isOvertime: false,
      targetDuration: newDuration,
      startTime: null,
    })
    setShowSettings(false)
    setShowCustomTimer(false)
  }

  // Timer effect
  useEffect(() => {
    if (timer.isRunning) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev.minutes === 0 && prev.seconds === 0 && !prev.isOvertime) {
            // Timer reached zero, start overtime
            return {
              ...prev,
              minutes: 0,
              seconds: 1,
              isOvertime: true,
            }
          } else if (prev.isOvertime) {
            // Count up in overtime
            const newSeconds = prev.seconds + 1
            return {
              ...prev,
              minutes: Math.floor(newSeconds / 60),
              seconds: newSeconds % 60,
            }
          } else {
            // Count down normally
            if (prev.seconds > 0) {
              return { ...prev, seconds: prev.seconds - 1 }
            } else if (prev.minutes > 0) {
              return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
            }
            return prev
          }
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timer.isRunning])

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Space bar to toggle timer
      if (event.code === "Space" && !showSettings && !showCustomTimer) {
        event.preventDefault()
        toggleTimer()
      }
      // F key for fullscreen
      if (event.code === "KeyF" && !showSettings && !showCustomTimer) {
        event.preventDefault()
        toggleFullscreen()
      }
      // Escape to exit fullscreen or close modals
      if (event.code === "Escape") {
        if (showCustomTimer) {
          setShowCustomTimer(false)
        } else if (showSettings) {
          setShowSettings(false)
        } else if (isFullscreen) {
          setIsFullscreen(false)
        }
      }
      // R key to reset
      if (event.code === "KeyR" && !showSettings && !showCustomTimer) {
        event.preventDefault()
        resetTimer()
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [timer.isRunning, showSettings, showCustomTimer, isFullscreen])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center p-4 transition-all duration-500",
        isFullscreen ? "bg-stone-900 text-white" : "bg-gradient-to-br from-stone-50 to-amber-50/30",
      )}
    >
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-10 text-stone-400 text-sm opacity-75 hover:opacity-100 transition-opacity">
          Press ESC or F to exit fullscreen
        </div>
      )}

      {isFullscreen && (
        <div className="fixed bottom-4 left-4 z-10 text-stone-500 text-xs space-y-1 opacity-50 hover:opacity-100 transition-opacity">
          <div>SPACE - Start/Pause</div>
          <div>R - Reset</div>
          <div>F - Toggle Fullscreen</div>
        </div>
      )}

      <div className={cn("w-full mx-auto", isFullscreen ? "max-w-4xl" : "max-w-2xl")}>
        {/* Custom Time Setter Modal */}
        {showCustomTimer && !isFullscreen && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <CustomTimeSetter
                currentMinutes={timer.minutes}
                currentSeconds={timer.seconds}
                onTimeSet={setCustomTime}
                onClose={() => setShowCustomTimer(false)}
              />
            </div>
          </div>
        )}

        {/* Settings Panel - Hidden in fullscreen */}
        {showSettings && !isFullscreen && (
          <Card className="mb-8 p-6 bg-white/80 backdrop-blur-sm border-stone-200">
            <div className="space-y-4">
              <div>
                <Label htmlFor="session-name" className="text-stone-700">
                  Session Name
                </Label>
                <Input
                  id="session-name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-stone-700">Quick Timer Presets</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[5, 15, 25, 45, 60].map((minutes) => (
                    <Button
                      key={minutes}
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomTime(minutes)}
                      className="text-stone-600 border-stone-300 hover:bg-stone-100"
                    >
                      {minutes}m
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomTimer(true)}
                    className="text-stone-600 border-stone-300 hover:bg-stone-100"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Custom
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Main Timer Display */}
        <Card
          className={cn(
            "shadow-xl transition-all duration-500",
            isFullscreen ? "bg-transparent border-none shadow-none" : "bg-white/90 backdrop-blur-sm border-stone-200",
          )}
        >
          <div className={cn("text-center transition-all duration-500", isFullscreen ? "p-16 md:p-24" : "p-8 md:p-12")}>
            {/* Timer Display */}
            <div className="mb-8">
              <div
                className={cn(
                  "font-mono font-light tracking-wider mb-4 transition-all duration-500",
                  isFullscreen ? "text-[12rem] md:text-[16rem] lg:text-[20rem]" : "text-8xl md:text-9xl",
                  timer.isOvertime
                    ? isFullscreen
                      ? "text-amber-400"
                      : "text-amber-600"
                    : isFullscreen
                      ? "text-white"
                      : "text-stone-800",
                )}
              >
                {formatTime(timer.minutes, timer.seconds)}
              </div>

              {/* Status Text */}
              <div
                className={cn(
                  "mb-2 transition-all duration-500",
                  isFullscreen ? "text-2xl md:text-3xl text-stone-300" : "text-lg md:text-xl text-stone-600",
                )}
              >
                {timer.isOvertime ? (
                  <span className={cn("font-medium", isFullscreen ? "text-amber-400" : "text-amber-600")}>
                    Extra Time: +{formatTime(timer.minutes, timer.seconds)}
                  </span>
                ) : timer.isRunning ? (
                  "Focus Time"
                ) : (
                  "Ready to Start"
                )}
              </div>

              <div
                className={cn(
                  "transition-all duration-500",
                  isFullscreen ? "text-lg text-stone-400" : "text-sm text-stone-500",
                )}
              >
                {sessionName}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                onClick={toggleTimer}
                size="lg"
                className={cn(
                  "rounded-full transition-all duration-300",
                  isFullscreen ? "w-20 h-20 md:w-24 md:h-24" : "w-16 h-16",
                  timer.isRunning
                    ? isFullscreen
                      ? "bg-stone-700 hover:bg-stone-600"
                      : "bg-stone-600 hover:bg-stone-700"
                    : isFullscreen
                      ? "bg-emerald-700 hover:bg-emerald-600"
                      : "bg-emerald-600 hover:bg-emerald-700",
                )}
              >
                {timer.isRunning ? (
                  <Pause className={cn(isFullscreen ? "w-8 h-8 md:w-10 md:h-10" : "w-6 h-6")} />
                ) : (
                  <Play className={cn(isFullscreen ? "w-8 h-8 md:w-10 md:h-10 ml-1" : "w-6 h-6 ml-1")} />
                )}
              </Button>

              <Button
                onClick={resetTimer}
                variant="outline"
                size="lg"
                className={cn(
                  "rounded-full transition-all duration-300",
                  isFullscreen
                    ? "w-20 h-20 md:w-24 md:h-24 border-stone-600 text-stone-300 hover:bg-stone-800 bg-transparent"
                    : "w-16 h-16 border-stone-300 text-stone-600 hover:bg-stone-100 bg-transparent",
                )}
              >
                <RotateCcw className={cn(isFullscreen ? "w-8 h-8 md:w-10 md:h-10" : "w-6 h-6")} />
              </Button>
            </div>

            {/* Secondary Controls - Hidden in fullscreen */}
            {!isFullscreen && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  variant="ghost"
                  size="sm"
                  className="text-stone-500 hover:text-stone-700"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>

                <Button
                  onClick={() => setShowCustomTimer(true)}
                  variant="ghost"
                  size="sm"
                  className="text-stone-500 hover:text-stone-700"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Set Time
                </Button>

                <Button
                  onClick={() => setShowSidebar(true)}
                  variant="ghost"
                  size="sm"
                  className="text-stone-500 hover:text-stone-700"
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>

                <Button
                  onClick={toggleFullscreen}
                  variant="ghost"
                  size="sm"
                  className="text-stone-500 hover:text-stone-700"
                >
                  <Maximize className="w-4 h-4 mr-2" />
                  Fullscreen
                </Button>
              </div>
            )}

            {isFullscreen && (
              <div className="mt-8">
                <Button
                  onClick={toggleFullscreen}
                  variant="ghost"
                  size="sm"
                  className="text-stone-400 hover:text-stone-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Exit Fullscreen
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Session History Sidebar - Hidden in fullscreen */}
      {!isFullscreen && <SessionHistorySidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />}
    </div>
  )
}
