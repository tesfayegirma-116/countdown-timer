"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, Maximize, History, X, Clock } from "lucide-react"
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
  const [flipTrigger, setFlipTrigger] = useState(0)

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

  // Check if we're in warning time (5 minutes or less remaining)
  const isWarningTime = !timer.isOvertime && timer.isRunning && totalSeconds <= 300 && totalSeconds > 0

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
            // Count up in overtime - continue infinitely
            if (prev.seconds === 59) {
              return {
                ...prev,
                minutes: prev.minutes + 1,
                seconds: 0,
              }
            } else {
              return {
                ...prev,
                seconds: prev.seconds + 1,
              }
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
      <style jsx global>{`
        html, body {
          overflow: hidden !important;
          height: 100vh !important;
          width: 100vw !important;
        }
        
        * {
          box-sizing: border-box;
        }
        @keyframes overtime-pulse-bg {
          0%, 100% { 
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #dc2626 100%);
            box-shadow: 0 0 40px rgba(220, 38, 38, 0.2), inset 0 0 60px rgba(220, 38, 38, 0.15);
          }
          50% { 
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #ef4444 100%);
            box-shadow: 0 0 50px rgba(239, 68, 68, 0.25), inset 0 0 70px rgba(239, 68, 68, 0.2);
          }
        }
        
        @keyframes warning-pulse-bg {
          0%, 100% { 
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%);
            box-shadow: 0 0 30px rgba(245, 158, 11, 0.2), inset 0 0 50px rgba(245, 158, 11, 0.15);
          }
          50% { 
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%);
            box-shadow: 0 0 40px rgba(251, 191, 36, 0.25), inset 0 0 60px rgba(251, 191, 36, 0.2);
          }
        }
        
        @keyframes overtime-heartbeat {
          0%, 100% { 
            transform: scale(1);
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(220, 38, 38, 0.4);
          }
          50% { 
            transform: scale(1.01);
            text-shadow: 0 0 25px rgba(255, 255, 255, 0.7), 0 0 50px rgba(220, 38, 38, 0.5);
          }
        }
        
        @keyframes warning-pulse {
          0%, 100% { 
            transform: scale(1);
            text-shadow: 0 0 15px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.4);
          }
          50% { 
            transform: scale(1.01);
            text-shadow: 0 0 20px rgba(0, 0, 0, 0.7), 0 0 40px rgba(245, 158, 11, 0.5);
          }
        }
        
        @keyframes soft-glow {
          0%, 100% { 
            box-shadow: 0 0 15px rgba(220, 38, 38, 0.3);
          }
          50% { 
            box-shadow: 0 0 25px rgba(220, 38, 38, 0.5), 0 0 40px rgba(234, 88, 12, 0.3);
          }
        }
        
        @keyframes card-pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 20px rgba(220, 38, 38, 0.2);
          }
          50% { 
            transform: scale(1.005);
            box-shadow: 0 0 30px rgba(220, 38, 38, 0.35), 0 0 50px rgba(234, 88, 12, 0.2);
          }
        }
        
        .overtime-pulse-bg {
          animation: overtime-pulse-bg 6s ease-in-out infinite;
        }
        
        .warning-pulse-bg {
          animation: warning-pulse-bg 8s ease-in-out infinite;
        }
        
        .overtime-heartbeat-text {
          animation: overtime-heartbeat 5s ease-in-out infinite;
        }
        
        .warning-pulse-text {
          animation: warning-pulse 6s ease-in-out infinite;
        }
        
        .soft-glow {
          animation: soft-glow 3s ease-in-out infinite;
        }
        
        .card-pulse {
          animation: card-pulse 4s ease-in-out infinite;
        }
        
        .gentle-border {
          border: 2px solid rgba(220, 38, 38, 0.3);
          animation: soft-glow 3s ease-in-out infinite;
        }
        
        @keyframes flip-down {
          0% {
            transform: rotateX(0deg);
          }
          50% {
            transform: rotateX(-90deg);
          }
          100% {
            transform: rotateX(0deg);
          }
        }
        
        .flip-animation {
          animation: flip-down 0.6s ease-in-out;
          transform-style: preserve-3d;
        }
        
        .digit-container {
          perspective: 1000px;
          display: inline-block;
        }
      `}</style>

      <div
        className={cn(
          "h-screen w-screen flex flex-col transition-all duration-700 overflow-hidden",
          isFullscreen
            ? timer.isOvertime
              ? "overtime-pulse-bg text-white"
              : isWarningTime
                ? "warning-pulse-bg text-black"
                : timer.isRunning
                  ? "bg-white text-black"
                  : "bg-black text-white"
            : timer.isOvertime
              ? "bg-gradient-to-br from-red-50 via-white to-red-50"
              : isWarningTime
                ? "bg-gradient-to-br from-amber-50 via-white to-yellow-50"
                : timer.isRunning
                  ? "bg-white"
                  : "bg-gradient-to-br from-slate-50 via-white to-blue-50",
        )}
      >
        {!isFullscreen && (
          <div className="w-full flex justify-center pt-8 pb-6">
            <div className="relative">
              <img
                src="https://zetseat.church/static/784249cfbfaf2b3892996cd64f064c82/d4cf7/logoEng.webp"
                alt="Zetseat Church Logo"
                className="relative h-16 md:h-20 lg:h-24 object-contain drop-shadow-lg"
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center overflow-hidden relative">
          {isFullscreen && (
            <div className="fixed top-2 right-2 z-10 text-neutral-400 text-xs opacity-40 hover:opacity-80 transition-all duration-300">
              ESC or F to exit
            </div>
          )}

          {isFullscreen && (
            <div className="fixed bottom-2 left-2 z-10 text-neutral-500 text-xs space-y-1 opacity-30 hover:opacity-70 transition-all duration-300">
              <div>SPACE - Start/Pause</div>
              <div>R - Reset</div>
            </div>
          )}

          <div
            className={cn(
              "w-full mx-auto flex items-center justify-center",
              isFullscreen ? "max-w-none h-full" : "max-w-4xl",
            )}
          >
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
            <div
              className={cn(
                "transition-all duration-700 w-full",
                isFullscreen ? "bg-transparent shadow-none" : "max-w-5xl mx-auto",
              )}
            >
              <div
                className={cn(
                  "text-center transition-all duration-700 flex flex-col items-center h-full w-full",
                  isFullscreen ? "justify-center relative" : "justify-center py-12 md:py-16 lg:py-20",
                )}
              >
                {/* Timer Display */}
                <div className={cn("mb-8 md:mb-12 relative", isFullscreen ? "flex flex-col justify-center items-center absolute inset-0" : "")}>
                  {!isFullscreen && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5 rounded-3xl blur-2xl transform scale-110 animate-pulse"></div>
                  )}
                  <div
                    className={cn(
                      "font-black tracking-wider mb-2 md:mb-1 transition-all duration-700 leading-none select-none",
                      isFullscreen
                        ? "text-6xl sm:text-[20xl] md:text-[22rem] lg:text-[24rem] xl:text-[32rem]"
                        : "text-6xl sm:text-8xl md:text-[12rem] lg:text-[14rem] xl:text-[12rem]",
                      timer.isOvertime
                        ? isFullscreen
                          ? "text-white drop-shadow-2xl"
                          : "text-red-600"
                        : isWarningTime
                          ? isFullscreen
                            ? "text-black drop-shadow-2xl"
                            : "text-amber-600"
                          : isFullscreen
                            ? timer.isRunning
                              ? "text-black drop-shadow-2xl"
                              : "text-white drop-shadow-2xl"
                            : timer.isRunning
                              ? "text-black"
                              : "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 bg-clip-text text-transparent",
                    )}
                    style={{
                      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                      fontWeight: 900,
                      textShadow: isFullscreen
                        ? timer.isOvertime
                          ? "0 0 50px rgba(255, 255, 255, 0.8), 0 0 100px rgba(220, 38, 38, 0.6)"
                          : isWarningTime
                            ? "0 0 40px rgba(0, 0, 0, 0.8), 0 0 80px rgba(245, 158, 11, 0.6)"
                            : timer.isRunning
                              ? "0 0 80px rgba(255,255,255,0.5)"
                              : "0 0 80px rgba(0,0,0,0.5)"
                        : timer.isOvertime
                          ? "0 0 30px rgba(220, 38, 38, 0.6)"
                          : isWarningTime
                            ? "0 0 25px rgba(245, 158, 11, 0.6)"
                            : timer.isRunning
                              ? "0 4px 20px rgba(0,0,0,0.2)"
                              : "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                  >
                    {formatTime(timer.minutes, timer.seconds)}
                  </div>

                  {/* Status Text - Only show in non-fullscreen */}
                  {!isFullscreen && (
                    <div
                      className={cn(
                        "mb-4 md:mb-6 transition-all duration-700 font-bold text-xl md:text-2xl lg:text-3xl relative z-10",
                        timer.isOvertime
                          ? "text-red-600"
                          : isWarningTime
                            ? "text-amber-600"
                            : timer.isRunning
                              ? "text-slate-800"
                              : "bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 bg-clip-text text-transparent",
                      )}
                    >
                      {timer.isOvertime ? (
                        <span
                          className="font-black text-2xl md:text-3xl lg:text-4xl"
                          style={{
                            textShadow: "0 0 15px rgba(220, 38, 38, 0.6)",
                          }}
                        >
                          🚨 OVERTIME 🚨
                        </span>
                      ) : isWarningTime ? (
                        <span
                          className="font-black text-xl md:text-2xl lg:text-3xl"
                          style={{
                            textShadow: "0 0 15px rgba(245, 158, 11, 0.6)",
                          }}
                        >
                          ⚠️ FINAL MINUTES ⚠️
                        </span>
                      ) : timer.isRunning ? (
                        "FOCUS TIME"
                      ) : (
                        "READY TO START"
                      )}
                    </div>
                  )}

                  {/* Session Name - Only show in non-fullscreen */}
                  {!isFullscreen && (
                    <div
                      className={cn(
                        "transition-all duration-700 font-medium tracking-wide text-base md:text-lg relative z-10",
                        timer.isOvertime
                          ? "text-red-500"
                          : isWarningTime
                            ? "text-amber-600"
                            : timer.isRunning
                              ? "text-slate-600"
                              : "text-slate-500",
                      )}
                      style={{
                        fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {sessionName}
                    </div>
                  )}
                </div>

                {/* Control Buttons */}
                <div className={cn(
                  "flex items-center justify-center gap-6 md:gap-8 mb-8 md:mb-12 relative z-10",
                  isFullscreen ? "hidden" : ""
                )}>
                  <Button
                    onClick={toggleTimer}
                    size="lg"
                    className={cn(
                      "rounded-full transition-all duration-500 shadow-xl hover:shadow-2xl font-bold",
                      isFullscreen
                        ? "w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20"
                        : "w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24",
                      timer.isRunning
                        ? isFullscreen
                          ? "bg-neutral-800 hover:bg-neutral-700 border-2 border-neutral-600"
                          : "bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border-2 border-slate-600 text-white shadow-lg hover:shadow-xl"
                        : isFullscreen
                          ? "bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400"
                          : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border-2 border-emerald-500 text-white shadow-lg hover:shadow-xl",
                      timer.isOvertime && isFullscreen ? "soft-glow" : "",
                    )}
                  >
                    {timer.isRunning ? (
                      <Pause
                        className={cn(
                          isFullscreen ? "w-4 h-4 md:w-5 md:h-5" : "w-6 h-6 md:w-8 md:h-8",
                        )}
                      />
                    ) : (
                      <Play
                        className={cn(
                          isFullscreen ? "w-4 h-4 md:w-5 md:h-5 ml-1" : "w-6 h-6 md:w-8 md:h-8 ml-1",
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
                        ? "w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 border-2 border-neutral-600 text-neutral-300 hover:bg-neutral-900 bg-transparent"
                        : "w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 border-2 border-slate-300 text-slate-600 hover:bg-slate-50 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl",
                      timer.isOvertime && isFullscreen ? "soft-glow" : "",
                    )}
                  >
                    <RotateCcw
                      className={cn(isFullscreen ? "w-4 h-4 md:w-5 md:h-5" : "w-6 h-6 md:w-8 md:h-8")}
                    />
                  </Button>
                </div>

                {/* Secondary Controls - Hidden in fullscreen */}
                {!isFullscreen && (
                  <div className="flex items-center justify-center gap-3 md:gap-4 flex-wrap relative z-10">
                    {/* <Button
                      onClick={() => setShowSettings(!showSettings)}
                      variant="ghost"
                      size="sm"
                      className="text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 px-3 md:px-4 py-2 font-semibold"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button> */}

                    <Button
                      onClick={() => setShowCustomTimer(true)}
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-4 md:px-5 py-2.5 font-semibold rounded-xl transition-all duration-300 backdrop-blur-sm bg-white/60 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Set Time
                    </Button>

                    <Button
                      onClick={() => setShowSidebar(true)}
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-4 md:px-5 py-2.5 font-semibold rounded-xl transition-all duration-300 backdrop-blur-sm bg-white/60 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                    >
                      <History className="w-4 h-4 mr-2" />
                      History
                    </Button>

                    <Button
                      onClick={toggleFullscreen}
                      variant="default"
                      size="sm"
                      className="bg-neutral-800 hover:bg-neutral-400 hover:shadow-2xl text-white px-3 md:px-4 py-2 shadow-lg font-bold"
                    >
                      <Maximize className="w-4 h-4 mr-2" />
                      Immersive Mode
                    </Button>
                  </div>
                )}

                {/* Fullscreen Control Buttons - Bottom Sticky */}
                {isFullscreen && (
                  <>
                    {/* Status Text and Session Name - Above Buttons */}
                    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-10 text-center opacity-60">
                      {/* Status Text */}
                      <div
                        className={cn(
                          "mb-1 transition-all duration-700 font-bold text-xs md:text-sm",
                          timer.isOvertime
                            ? "text-white animate-pulse"
                            : isWarningTime
                              ? "text-black animate-pulse"
                              : "text-neutral-200",
                        )}
                      >
                        {timer.isOvertime ? (
                          <span
                            className="font-black"
                            style={{
                              textShadow: "0 0 10px rgba(255, 255, 255, 0.6), 0 0 20px rgba(220, 38, 38, 0.4)",
                            }}
                          >
                            🚨 OVERTIME 🚨
                          </span>
                        ) : isWarningTime ? (
                          <span
                            className="font-black"
                            style={{
                              textShadow: "0 0 10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.4)",
                            }}
                          >
                            ⚠️ FINAL MINUTES ⚠️
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
                          "transition-all duration-700 font-medium tracking-wide text-xs",
                          timer.isOvertime
                            ? "text-red-200"
                            : isWarningTime
                              ? "text-yellow-800"
                              : "text-neutral-400",
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
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-6">
                      {/* Play/Pause Button */}
                      <Button
                        onClick={toggleTimer}
                        size="sm"
                        className={cn(
                          "rounded-full transition-all duration-500 shadow-lg hover:shadow-xl font-bold w-14 h-14",
                          timer.isRunning
                            ? "bg-neutral-900 hover:bg-neutral-800 border-2 border-neutral-700"
                            : "bg-emerald-700 hover:bg-emerald-600 border-2 border-emerald-500",
                          timer.isOvertime ? "soft-glow" : "",
                        )}
                      >
                        {timer.isRunning ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </Button>

                      {/* Reset Button */}
                      <Button
                        onClick={resetTimer}
                        size="sm"
                        className={cn(
                          "rounded-full transition-all duration-500 shadow-lg hover:shadow-xl font-bold w-14 h-14 bg-neutral-900 hover:bg-neutral-800 border-2 border-neutral-700 text-white",
                          timer.isOvertime ? "soft-glow" : "",
                        )}
                      >
                        <RotateCcw className="w-5 h-5" />
                      </Button>

                      {/* Exit Button */}
                      <Button
                        onClick={toggleFullscreen}
                        variant="ghost"
                        size="sm"
                        className="text-neutral-300 hover:text-neutral-100 hover:bg-neutral-900 bg-neutral-800/40 p-2 rounded-full font-semibold opacity-70 hover:opacity-100 w-10 h-10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Session History Sidebar - Hidden in fullscreen */}
          {!isFullscreen && <SessionHistorySidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />}
        </div>
      </div>
    </>
  )
}
