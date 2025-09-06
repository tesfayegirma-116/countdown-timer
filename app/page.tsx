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
  const [showSidebar, setShowSidebar] = useState(false) // Declare showSidebar variable
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const getCurrentDateString = () => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return now.toLocaleDateString("en-US", options)
  }

  const [sessionName, setSessionName] = useState(getCurrentDateString())

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
    <>
      <style jsx>{`
        @keyframes ambulance-flash {
          0%, 50% { 
            background: linear-gradient(135deg, #dc2626 0%, #7f1d1d 50%, #dc2626 100%);
            box-shadow: 0 0 100px rgba(220, 38, 38, 0.8), inset 0 0 100px rgba(220, 38, 38, 0.3);
          }
          25%, 75% { 
            background: linear-gradient(135deg, #ea580c 0%, #9a3412 50%, #ea580c 100%);
            box-shadow: 0 0 100px rgba(234, 88, 12, 0.8), inset 0 0 100px rgba(234, 88, 12, 0.3);
          }
        }
        
        @keyframes heartbeat {
          0%, 100% { 
            transform: scale(1);
            text-shadow: 0 0 20px rgba(220, 38, 38, 0.8);
          }
          14% { 
            transform: scale(1.05);
            text-shadow: 0 0 40px rgba(220, 38, 38, 1);
          }
          28% { 
            transform: scale(1);
            text-shadow: 0 0 20px rgba(220, 38, 38, 0.8);
          }
          42% { 
            transform: scale(1.08);
            text-shadow: 0 0 50px rgba(220, 38, 38, 1);
          }
          70% { 
            transform: scale(1);
            text-shadow: 0 0 20px rgba(220, 38, 38, 0.8);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(220, 38, 38, 0.5);
          }
          50% { 
            box-shadow: 0 0 60px rgba(220, 38, 38, 0.9), 0 0 100px rgba(234, 88, 12, 0.6);
          }
        }
        
        .ambulance-bg {
          animation: ambulance-flash 1.5s infinite;
        }
        
        .heartbeat-text {
          animation: heartbeat 1.2s infinite;
        }
        
        .pulse-glow {
          animation: pulse-glow 2s infinite;
        }
        
        .emergency-border {
          border: 3px solid transparent;
          background: linear-gradient(45deg, #dc2626, #ea580c, #dc2626) border-box;
          animation: pulse-glow 1s infinite;
        }
      `}</style>

      <div
        className={cn(
          "min-h-screen flex flex-col transition-all duration-700",
          isFullscreen
            ? timer.isOvertime
              ? "ambulance-bg text-white" // Using custom ambulance animation class
              : "bg-black text-white"
            : "bg-gradient-to-br from-stone-50 via-neutral-50 to-amber-50/30",
        )}
      >
        {!isFullscreen && (
          <div className="w-full flex justify-center pt-6 pb-4">
            <img
              src="https://zetseat.church/static/784249cfbfaf2b3892996cd64f064c82/d4cf7/logoEng.webp"
              alt="Zetseat Church Logo"
              className="h-12 md:h-16 lg:h-20 object-contain"
            />
          </div>
        )}

        <div className="flex-1 flex items-center justify-center p-4">
          {isFullscreen && (
            <div className="fixed top-4 right-4 z-10 text-neutral-400 text-xs md:text-sm opacity-60 hover:opacity-100 transition-all duration-300">
              Press ESC or F to exit fullscreen
            </div>
          )}

          {isFullscreen && (
            <div className="fixed bottom-4 left-4 z-10 text-neutral-500 text-xs space-y-1 opacity-40 hover:opacity-100 transition-all duration-300">
              <div>SPACE - Start/Pause</div>
              <div>R - Reset</div>
              <div>F - Toggle Fullscreen</div>
            </div>
          )}

          <div className={cn("w-full mx-auto", isFullscreen ? "max-w-7xl" : "max-w-4xl")}>
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
              <Card className="mb-6 p-6 bg-white/90 backdrop-blur-md border-stone-200 shadow-xl">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="session-name" className="text-stone-700 font-semibold">
                      Session Name
                    </Label>
                    <Input
                      id="session-name"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      className="mt-2 font-medium"
                    />
                  </div>
                  <div>
                    <Label className="text-stone-700 font-semibold">Quick Timer Presets</Label>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {[5, 15, 25, 45, 60].map((minutes) => (
                        <Button
                          key={minutes}
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomTime(minutes)}
                          className="text-stone-600 border-stone-300 hover:bg-stone-100 font-semibold"
                        >
                          {minutes}m
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomTimer(true)}
                        className="text-stone-600 border-stone-300 hover:bg-stone-100 font-semibold"
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
                isFullscreen && timer.isOvertime ? "emergency-border" : "",
              )}
            >
              <div
                className={cn(
                  "text-center transition-all duration-700",
                  isFullscreen ? "p-8 md:p-16 lg:p-20" : "p-8 md:p-12 lg:p-16",
                )}
              >
                {/* Timer Display */}
                <div className="mb-8 md:mb-12">
                  <div
                    className={cn(
                      "font-black tracking-wider mb-4 md:mb-6 transition-all duration-700 leading-none select-none",
                      isFullscreen
                        ? "text-8xl sm:text-[12rem] md:text-[16rem] lg:text-[20rem] xl:text-[24rem] 2xl:text-[28rem]"
                        : "text-6xl sm:text-8xl md:text-[12rem] lg:text-[14rem] xl:text-[12rem]",
                      timer.isOvertime
                        ? isFullscreen
                          ? "text-red-400 drop-shadow-2xl heartbeat-text" // Added heartbeat animation class
                          : "text-red-500 heartbeat-text" // Added heartbeat animation for non-fullscreen too
                        : isFullscreen
                          ? "text-white drop-shadow-2xl"
                          : "text-neutral-800",
                    )}
                    style={{
                      textShadow: isFullscreen
                        ? timer.isOvertime
                          ? "0 0 80px rgba(220, 38, 38, 0.8), 0 0 120px rgba(234, 88, 12, 0.6)" // Enhanced glow for overtime
                          : "0 0 80px rgba(0,0,0,0.5)"
                        : "0 4px 20px rgba(0,0,0,0.1)",
                      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                    }}
                  >
                    {formatTime(timer.minutes, timer.seconds)}
                  </div>

                  {/* Status Text */}
                  <div
                    className={cn(
                      "mb-3 md:mb-4 transition-all duration-700 font-bold",
                      isFullscreen
                        ? "text-xl md:text-3xl lg:text-4xl text-neutral-200"
                        : "text-lg md:text-xl lg:text-2xl text-neutral-600",
                      timer.isOvertime ? "animate-pulse" : "",
                    )}
                  >
                    {timer.isOvertime ? (
                      <span
                        className={cn("font-black", isFullscreen ? "text-red-400" : "text-red-500")}
                        style={{
                          textShadow: "0 0 20px rgba(220, 38, 38, 0.8), 0 0 40px rgba(234, 88, 12, 0.6)",
                        }}
                      >
                        ⚠️ OVERTIME: +{formatTime(timer.minutes, timer.seconds)} ⚠️
                      </span>
                    ) : timer.isRunning ? (
                      "FOCUS TIME"
                    ) : (
                      "READY TO START"
                    )}
                  </div>

                  {/* Session Name */}
                  <div
                    className={cn(
                      "transition-all duration-700 font-semibold tracking-wide",
                      isFullscreen
                        ? "text-base md:text-xl lg:text-2xl text-neutral-400"
                        : "text-sm md:text-base text-neutral-500",
                    )}
                    style={{
                      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {sessionName}
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-4 md:gap-6 mb-6 md:mb-8">
                  <Button
                    onClick={toggleTimer}
                    size="lg"
                    className={cn(
                      "rounded-full transition-all duration-500 shadow-xl hover:shadow-2xl font-bold",
                      isFullscreen
                        ? "w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32"
                        : "w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24",
                      timer.isRunning
                        ? isFullscreen
                          ? "bg-neutral-800 hover:bg-neutral-700 border-2 border-neutral-600"
                          : "bg-neutral-700 hover:bg-neutral-800"
                        : isFullscreen
                          ? "bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400"
                          : "bg-emerald-600 hover:bg-emerald-700",
                      timer.isOvertime && isFullscreen ? "pulse-glow" : "",
                    )}
                  >
                    {timer.isRunning ? (
                      <Pause
                        className={cn(
                          isFullscreen ? "w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14" : "w-6 h-6 md:w-8 md:h-8",
                        )}
                      />
                    ) : (
                      <Play
                        className={cn(
                          isFullscreen ? "w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14 ml-1" : "w-6 h-6 md:w-8 md:h-8 ml-1",
                        )}
                      />
                    )}
                  </Button>

                  <Button
                    onClick={resetTimer}
                    variant="outline"
                    size="lg"
                    className={cn(
                      "rounded-full transition-all duration-500 shadow-lg hover:shadow-xl font-bold",
                      isFullscreen
                        ? "w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 border-2 border-neutral-600 text-neutral-300 hover:bg-neutral-900 bg-transparent"
                        : "w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 border-2 border-neutral-300 text-neutral-600 hover:bg-neutral-100 bg-transparent",
                      timer.isOvertime && isFullscreen ? "pulse-glow" : "",
                    )}
                  >
                    <RotateCcw
                      className={cn(isFullscreen ? "w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14" : "w-6 h-6 md:w-8 md:h-8")}
                    />
                  </Button>
                </div>

                {/* Secondary Controls - Hidden in fullscreen */}
                {!isFullscreen && (
                  <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
                    <Button
                      onClick={() => setShowSettings(!showSettings)}
                      variant="ghost"
                      size="sm"
                      className="text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 px-3 md:px-4 py-2 font-semibold"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>

                    <Button
                      onClick={() => setShowCustomTimer(true)}
                      variant="ghost"
                      size="sm"
                      className="text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 px-3 md:px-4 py-2 font-semibold"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Set Time
                    </Button>

                    <Button
                      onClick={() => setShowSidebar(true)}
                      variant="ghost"
                      size="sm"
                      className="text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 px-3 md:px-4 py-2 font-semibold"
                    >
                      <History className="w-4 h-4 mr-2" />
                      History
                    </Button>

                    <Button
                      onClick={toggleFullscreen}
                      variant="default"
                      size="sm"
                      className="bg-neutral-800 hover:bg-neutral-900 text-white px-3 md:px-4 py-2 shadow-lg font-bold"
                    >
                      <Maximize className="w-4 h-4 mr-2" />
                      Immersive Mode
                    </Button>
                  </div>
                )}

                {isFullscreen && (
                  <div className="mt-8 md:mt-12">
                    <Button
                      onClick={toggleFullscreen}
                      variant="ghost"
                      size="lg"
                      className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold"
                    >
                      <X className="w-4 md:w-5 h-4 md:h-5 mr-2" />
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
      </div>
    </>
  )
}
