"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Plus, Minus, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomTimeSetterProps {
  currentMinutes: number
  currentSeconds: number
  onTimeSet: (minutes: number, seconds: number) => void
  onClose: () => void
}

export function CustomTimeSetter({ currentMinutes, currentSeconds, onTimeSet, onClose }: CustomTimeSetterProps) {
  const [minutes, setMinutes] = useState(currentMinutes)
  const [seconds, setSeconds] = useState(currentSeconds)

  const handleMinutesChange = (value: number) => {
    setMinutes(Math.max(0, Math.min(180, value))) // Max 3 hours
  }

  const handleSecondsChange = (value: number) => {
    setSeconds(Math.max(0, Math.min(59, value)))
  }

  const handleSliderChange = (value: number[]) => {
    const totalSeconds = value[0]
    const newMinutes = Math.floor(totalSeconds / 60)
    const newSeconds = totalSeconds % 60
    setMinutes(newMinutes)
    setSeconds(newSeconds)
  }

  const handleApply = () => {
    onTimeSet(minutes, seconds)
    onClose()
  }

  const totalSeconds = minutes * 60 + seconds
  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="p-6 bg-white/95 backdrop-blur-sm border-stone-200 shadow-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-stone-600" />
          <h3 className="text-lg font-semibold text-stone-800">Set Custom Time</h3>
        </div>

        {/* Time Display */}
        <div className="text-center">
          <div className="text-4xl font-mono font-light text-stone-800 mb-2">{formatTime(minutes, seconds)}</div>
          <div className="text-sm text-stone-500">
            {totalSeconds > 0 ? `${totalSeconds} seconds total` : "Set a time above 0"}
          </div>
        </div>

        {/* Slider Control */}
        <div className="space-y-3">
          <Label className="text-stone-700">Quick Adjust (0-180 minutes)</Label>
          <Slider
            value={[totalSeconds]}
            onValueChange={handleSliderChange}
            max={10800} // 180 minutes
            step={60} // 1 minute steps
            className="w-full"
          />
          <div className="flex justify-between text-xs text-stone-500">
            <span>0m</span>
            <span>90m</span>
            <span>180m</span>
          </div>
        </div>

        {/* Manual Input Controls */}
        <div className="grid grid-cols-2 gap-4">
          {/* Minutes */}
          <div className="space-y-2">
            <Label className="text-stone-700">Minutes</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMinutesChange(minutes - 1)}
                disabled={minutes <= 0}
                className="w-8 h-8 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                value={minutes}
                onChange={(e) => handleMinutesChange(Number.parseInt(e.target.value) || 0)}
                className="text-center"
                min="0"
                max="180"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMinutesChange(minutes + 1)}
                disabled={minutes >= 180}
                className="w-8 h-8 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Seconds */}
          <div className="space-y-2">
            <Label className="text-stone-700">Seconds</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSecondsChange(seconds - 1)}
                disabled={seconds <= 0}
                className="w-8 h-8 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                value={seconds}
                onChange={(e) => handleSecondsChange(Number.parseInt(e.target.value) || 0)}
                className="text-center"
                min="0"
                max="59"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSecondsChange(seconds + 1)}
                disabled={seconds >= 59}
                className="w-8 h-8 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <Label className="text-stone-700">Popular Presets</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "5m", minutes: 5, seconds: 0 },
              { label: "10m", minutes: 10, seconds: 0 },
              { label: "15m", minutes: 15, seconds: 0 },
              { label: "20m", minutes: 20, seconds: 0 },
              { label: "25m", minutes: 25, seconds: 0 },
              { label: "30m", minutes: 30, seconds: 0 },
              { label: "45m", minutes: 45, seconds: 0 },
              { label: "60m", minutes: 60, seconds: 0 },
              { label: "90m", minutes: 90, seconds: 0 },
            ].map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  setMinutes(preset.minutes)
                  setSeconds(preset.seconds)
                }}
                className={cn(
                  "text-stone-600 border-stone-300 hover:bg-stone-100",
                  minutes === preset.minutes && seconds === preset.seconds && "bg-stone-100 border-stone-400",
                )}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleApply}
            disabled={totalSeconds === 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Apply Time
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  )
}
