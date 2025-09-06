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
        "min-h-screen flex items-center justify-center p-4 transition-all duration-700",
        isFullscreen ? "bg-black text-white" : "bg-gradient-to-br from-neutral-50 via-stone-50 to-amber-50/20",
      )}
    >
      {isFullscreen && (
        <div className="fixed top-6 right-6 z-10 text-neutral-400 text-sm opacity-60 hover:opacity-100 transition-all duration-300">
          Press ESC or F to exit fullscreen
        </div>
      )}

      {isFullscreen && (
        <div className="fixed bottom-6 left-6 z-10 text-neutral-500 text-xs space-y-1 opacity-40 hover:opacity-100 transition-all duration-300">
          <div>SPACE - Start/Pause</div>
          <div>R - Reset</div>
          <div>F - Toggle Fullscreen</div>
        </div>
      )}

      <div className={cn("w-full mx-auto", isFullscreen ? "max-w-6xl" : "max-w-3xl")}>
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
            "shadow-2xl transition-all duration-700 border-0",
            isFullscreen ? "bg-transparent shadow-none" : "bg-white/95 backdrop-blur-md",
          )}
        >
          <div
            className={cn("text-center transition-all duration-700", isFullscreen ? "p-20 md:p-32" : "p-12 md:p-16")}
          >
            {/* Timer Display */}
            <div className="mb-12">
              <div
                className={cn(
                  "font-mono font-extralight tracking-widest mb-6 transition-all duration-700 leading-none",
                  isFullscreen
                    ? "text-[16rem] md:text-[24rem] lg:text-[32rem] xl:text-[40rem]"
                    : "text-[8rem] md:text-[12rem] lg:text-[16rem]",
                  timer.isOvertime
                    ? isFullscreen
                      ? "text-amber-300 drop-shadow-2xl"
                      : "text-amber-500"
                    : isFullscreen
                      ? "text-white drop-shadow-2xl"
                      : "text-neutral-800",
                )}
                style={{
                  textShadow: isFullscreen ? "0 0 60px rgba(0,0,0,0.3)" : "none",
                }}
              >
                {formatTime(timer.minutes, timer.seconds)}
              </div>

              {/* Status Text */}
              <div
                className={cn(
                  "mb-4 transition-all duration-700 font-light",
                  isFullscreen ? "text-3xl md:text-5xl text-neutral-200" : "text-xl md:text-2xl text-neutral-600",
                )}
              >
                {timer.isOvertime ? (
                  <span className={cn("font-medium", isFullscreen ? "text-amber-300" : "text-amber-500")}>
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
                  "transition-all duration-700 font-light tracking-wide",
                  isFullscreen ? "text-xl md:text-2xl text-neutral-400" : "text-base text-neutral-500",
                )}
              >
                {sessionName}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <Button
                onClick={toggleTimer}
                size="lg"
                className={cn(
                  "rounded-full transition-all duration-500 shadow-xl hover:shadow-2xl",
                  isFullscreen ? "w-28 h-28 md:w-36 md:h-36" : "w-20 h-20 md:w-24 md:h-24",
                  timer.isRunning
                    ? isFullscreen
                      ? "bg-neutral-800 hover:bg-neutral-700 border-2 border-neutral-600"
                      : "bg-neutral-700 hover:bg-neutral-800"
                    : isFullscreen
                      ? "bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400"
                      : "bg-emerald-600 hover:bg-emerald-700",
                )}
              >
                {timer.isRunning ? (
                  <Pause className={cn(isFullscreen ? "w-12 h-12 md:w-16 md:h-16" : "w-8 h-8 md:w-10 md:h-10")} />
                ) : (
                  <Play
                    className={cn(isFullscreen ? "w-12 h-12 md:w-16 md:h-16 ml-2" : "w-8 h-8 md:w-10 md:h-10 ml-1")}
                  />
                )}
              </Button>

              <Button
                onClick={resetTimer}
                variant="outline"
                size="lg"
                className={cn(
                  "rounded-full transition-all duration-500 shadow-lg hover:shadow-xl",
                  isFullscreen
                    ? "w-28 h-28 md:w-36 md:h-36 border-2 border-neutral-600 text-neutral-300 hover:bg-neutral-900 bg-transparent"
                    : "w-20 h-20 md:w-24 md:h-24 border-2 border-neutral-300 text-neutral-600 hover:bg-neutral-100 bg-transparent",
                )}
              >
                <RotateCcw className={cn(isFullscreen ? "w-12 h-12 md:w-16 md:h-16" : "w-8 h-8 md:w-10 md:h-10")} />
              </Button>
            </div>

            {/* Secondary Controls - Hidden in fullscreen */}
            {!isFullscreen && (
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  variant="ghost"
                  size="sm"
                  className="text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 px-4 py-2"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>

                <Button
                  onClick={() => setShowCustomTimer(true)}
                  variant="ghost"
                  size="sm"
                  className="text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 px-4 py-2"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Set Time
                </Button>

                <Button
                  onClick={() => setShowSidebar(true)}
                  variant="ghost"
                  size="sm"
                  className="text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 px-4 py-2"
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>

                <Button
                  onClick={toggleFullscreen}
                  variant="default"
                  size="sm"
                  className="bg-neutral-800 hover:bg-neutral-900 text-white px-4 py-2 shadow-lg"
                >
                  <Maximize className="w-4 h-4 mr-2" />
                  Immersive Mode
                </Button>
              </div>
            )}

            {isFullscreen && (
              <div className="mt-12">
                <Button
                  onClick={toggleFullscreen}
                  variant="ghost"
                  size="lg"
                  className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 px-6 py-3 rounded-full"
                >
                  <X className="w-5 h-5 mr-2" />
                  Exit Immersive Mode
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
