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
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        html, body {
          overflow: hidden !important;
          height: 100vh !important;
          width: 100vw !important;
        }
        
        * {
          box-sizing: border-box;
        }
        
        .clock-font {
          font-family: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-feature-settings: 'tnum' 1, 'zero' 1;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.05em;
          font-stretch: expanded;
        }
        
        @keyframes gentle-breathe {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.95;
          }
          50% { 
            transform: scale(1.002);
            opacity: 1;
          }
        }
        
        @keyframes overtime-pulse-bg {
          0%, 100% { 
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #dc2626 100%);
          }
        }
        
        @keyframes warning-pulse-bg {
          0%, 100% { 
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%);
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
        
        .gentle-breathe {
          animation: gentle-breathe 8s ease-in-out infinite;
        }
        
        .overtime-pulse-bg {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #dc2626 100%);
        }
        
        .warning-pulse-bg {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%);
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
        
        .minimal-gradient {
          background: linear-gradient(135deg, #fafafa 0%, #f8fafc 50%, #f1f5f9 100%);
        }
        
        .glass-effect {
          backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        /* Creative Logo Styles */
        .creative-logo-container {
          position: relative;
          display: inline-block;
        }
        
        .logo-glow-bg {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120%;
          height: 120%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 70%);
          border-radius: 50%;
          animation: gentle-breathe 6s ease-in-out infinite;
        }
        
        .creative-logo {
          transition: all 0.3s ease;
          filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.1));
        }
        
        .creative-logo:hover {
          transform: scale(1.05);
          filter: drop-shadow(0 8px 30px rgba(0, 0, 0, 0.15));
        }
        
        /* Creative Controls Styles */
        .creative-controls-container {
          position: relative;
          display: inline-block;
        }
        
        .creative-controls-bg {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200%;
          height: 150%;
          background: radial-gradient(ellipse, rgba(148, 163, 184, 0.08) 0%, rgba(71, 85, 105, 0.04) 50%, transparent 70%);
          border-radius: 50%;
          animation: gentle-breathe 10s ease-in-out infinite reverse;
        }
        
        .creative-button {
          position: relative;
          border-radius: 50%;
          overflow: hidden;
        }
        
        .creative-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        
        .creative-button:hover::before {
          transform: translateX(100%);
        }
        
        .creative-play-button {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        }
        
        .creative-reset-button {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8) inset;
        }
        
        /* Creative Secondary Controls */
        .creative-secondary-controls {
          position: relative;
        }
        
        .creative-secondary-button {
          position: relative;
          overflow: hidden;
        }
        
        .creative-secondary-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left 0.5s ease;
        }
        
        .creative-secondary-button:hover::before {
          left: 100%;
        }
        
        .creative-focus-button {
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }
        
        .creative-focus-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }
        
        .creative-focus-button:hover::before {
          left: 100%;
        }
        
        /* Natural Info Container */
        .natural-info-container {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }
        
        /* Pro Minimalist Button Styles */
        .pro-controls-container {
          position: relative;
        }
        
        .pro-button {
          border-radius: 50%;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .pro-play-button {
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset,
            0 1px 0 rgba(255, 255, 255, 0.2) inset;
        }
        
        .pro-play-button:hover {
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.15) inset,
            0 1px 0 rgba(255, 255, 255, 0.25) inset;
        }
        
        .pro-reset-button {
          box-shadow: 
            0 15px 30px rgba(0, 0, 0, 0.08),
            0 0 0 1px rgba(0, 0, 0, 0.05) inset,
            0 1px 0 rgba(255, 255, 255, 0.9) inset;
        }
        
        .pro-reset-button:hover {
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.12),
            0 0 0 1px rgba(0, 0, 0, 0.08) inset,
            0 1px 0 rgba(255, 255, 255, 0.95) inset;
        }
        
        .pro-button::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.05) 100%);
          pointer-events: none;
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
              ? "bg-red-50"
              : isWarningTime
                ? "bg-amber-50"
                : "bg-white",
        )}
      >
        {!isFullscreen && (
          <div className="w-full flex justify-center pt-6 pb-2">
            <img
              src="https://zetseat.church/static/784249cfbfaf2b3892996cd64f064c82/d4cf7/logoEng.webp"
              alt="Zetseat Church Logo"
              className="h-8 md:h-10 object-contain opacity-60 hover:opacity-80 transition-opacity duration-300"
            />
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
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
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
                isFullscreen ? "bg-transparent shadow-none" : "max-w-4xl mx-auto",
              )}
            >
              <div
                className={cn(
                  "text-center transition-all duration-700 flex flex-col items-center h-full w-full",
                  isFullscreen ? "justify-center relative" : "justify-center py-4 md:py-6 lg:py-8",
                )}
              >
                {/* Timer Display */}
                <div className={cn("mb-8 md:mb-12 relative", isFullscreen ? "flex flex-col justify-center items-center absolute inset-0" : "")}>
                  <div
                    className={cn(
                      "clock-font tracking-tight mb-4 transition-all duration-700 leading-none select-none w-full flex justify-center",
                      isFullscreen
                        ? "text-6xl sm:text-[20xl] md:text-[22rem] lg:text-[24rem] xl:text-[32rem]"
                        : "",
                      timer.isOvertime
                        ? isFullscreen
                          ? "text-white drop-shadow-2xl font-black"
                          : "text-red-500 font-black"
                        : isWarningTime
                          ? isFullscreen
                            ? "text-black drop-shadow-2xl font-black"
                            : "text-amber-500 font-black"
                          : isFullscreen
                            ? timer.isRunning
                              ? "text-black drop-shadow-2xl font-black"
                              : "text-white drop-shadow-2xl font-black"
                            : timer.isRunning
                              ? "text-gray-900 font-black"
                              : "text-gray-800 font-black",
                      !isFullscreen && !timer.isOvertime && !isWarningTime ? "gentle-breathe" : "",
                    )}
                    style={{
                      fontWeight: 900,
                      fontSize: isFullscreen
                        ? undefined
                        : `clamp(6rem, 20vw, 24rem)`,
                      textShadow: isFullscreen
                        ? timer.isOvertime
                          ? "0 0 50px rgba(255, 255, 255, 0.8), 0 0 100px rgba(220, 38, 38, 0.6)"
                          : isWarningTime
                            ? "0 0 40px rgba(0, 0, 0, 0.8), 0 0 80px rgba(245, 158, 11, 0.6)"
                            : timer.isRunning
                              ? "0 0 80px rgba(255,255,255,0.5)"
                              : "0 0 80px rgba(0,0,0,0.5)"
                        : !isFullscreen
                          ? "0 4px 20px rgba(0,0,0,0.15)"
                          : "none",
                    }}
                  >
                    {formatTime(timer.minutes, timer.seconds)}
                  </div>


                </div>

                {/* Minimalist Control Buttons */}
                <div className={cn(
                  "mb-8 relative z-10",
                  isFullscreen ? "hidden" : ""
                )}>
                  <div className="flex items-center justify-center gap-6 relative z-10">
                    <Button
                      onClick={toggleTimer}
                      size="lg"
                      className={cn(
                        "transition-all duration-200 border-0 rounded-full shadow-2xl",
                        "w-16 h-16 md:w-20 md:h-20",
                        timer.isRunning
                          ? "bg-gray-900 hover:bg-gray-800 text-white"
                          : "bg-yellow-500 hover:bg-gray-700 text-white",
                        "hover:scale-105 active:scale-95",
                      )}
                    >
                      {timer.isRunning ? (
                        <Pause className="w-6 h-6 md:w-7 md:h-7" />
                      ) : (
                        <Play className="w-6 h-6 md:w-7 md:h-7 ml-0.5" />
                      )}
                    </Button>

                    <Button
                      onClick={resetTimer}
                      variant="ghost"
                      size="lg"
                      className={cn(
                        "transition-all duration-200 rounded-full",
                        "w-12 h-12 md:w-14 md:h-14",
                        "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                        "hover:scale-105 active:scale-95",
                      )}
                    >
                      <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                    </Button>
                  </div>
                </div>

                {/* Minimalist Secondary Controls */}
                {!isFullscreen && (
                  <div className="flex items-center justify-center gap-2 relative z-10 mb-8">
                    <Button
                      onClick={() => setShowCustomTimer(true)}
                      variant="outline"
                      size="sm"
                      className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 px-4 py-2"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Set Time
                    </Button>

                    <Button
                      onClick={() => setShowSidebar(true)}
                      variant="outline"
                      size="sm"
                      className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 px-4 py-2"
                    >
                      <History className="w-4 h-4 mr-2" />
                      History
                    </Button>

                    <Button
                      onClick={toggleFullscreen}
                      variant="default"
                      size="sm"
                      className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg"
                    >
                      <Maximize className="w-4 h-4 mr-1.5" />
                      <span className="text-sm font-medium">Immersive Mode</span>
                    </Button>
                  </div>
                )}

                {/* Status and Date at Bottom */}
                {!isFullscreen && (
                  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 text-center z-10">
                    <div
                      className={cn(
                        "transition-all duration-700 text-lg font-medium mb-1",
                        timer.isOvertime
                          ? "text-red-500"
                          : isWarningTime
                            ? "text-amber-500"
                            : timer.isRunning
                              ? "text-gray-700"
                              : "text-gray-600",
                      )}
                    >
                      {timer.isOvertime ? (
                        "Overtime"
                      ) : isWarningTime ? (
                        "Final Minutes"
                      ) : timer.isRunning ? (
                        "Focus Time"
                      ) : (
                        "Ready to Start"
                      )}
                    </div>
                    <div className="text-xs text-gray-400 font-normal">
                      {getCurrentDateString()}
                    </div>
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
