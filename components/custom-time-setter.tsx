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
    <Card className="p-8 shadow-lg">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground">Set Timer Duration</h3>
          <p className="text-sm text-muted-foreground mt-1">Choose your focus session length</p>
        </div>

        {/* Time Display */}
        <div className="text-center">
          <div className="text-6xl font-mono font-bold text-foreground mb-4">{formatTime(minutes, seconds)}</div>
          <p className="text-sm text-muted-foreground">
            {totalSeconds > 0 ? `${totalSeconds} seconds total` : "Set a time above 0"}
          </p>
        </div>

        {/* Slider Control */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Quick Adjust</Label>
          <Slider
            value={[totalSeconds]}
            onValueChange={handleSliderChange}
            max={10800} // 180 minutes
            step={60} // 1 minute steps
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 min</span>
            <span>90 min</span>
            <span>180 min</span>
          </div>
        </div>

        {/* Manual Input Controls */}
        <div className="grid grid-cols-2 gap-6">
          {/* Minutes */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Minutes</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMinutesChange(minutes - 1)}
                disabled={minutes <= 0}
                className="h-9 w-9 p-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={minutes}
                onChange={(e) => handleMinutesChange(Number.parseInt(e.target.value) || 0)}
                className="text-center h-9"
                min="0"
                max="180"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMinutesChange(minutes + 1)}
                disabled={minutes >= 180}
                className="h-9 w-9 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Seconds */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Seconds</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSecondsChange(seconds - 1)}
                disabled={seconds <= 0}
                className="h-9 w-9 p-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={seconds}
                onChange={(e) => handleSecondsChange(Number.parseInt(e.target.value) || 0)}
                className="text-center h-9"
                min="0"
                max="59"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSecondsChange(seconds + 1)}
                disabled={seconds >= 59}
                className="h-9 w-9 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Popular Presets</Label>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "5", minutes: 5, seconds: 0 },
              { label: "10", minutes: 10, seconds: 0 },
              { label: "15", minutes: 15, seconds: 0 },
              { label: "20", minutes: 20, seconds: 0 },
              { label: "25", minutes: 25, seconds: 0 },
              { label: "30", minutes: 30, seconds: 0 },
              { label: "45", minutes: 45, seconds: 0 },
              { label: "60", minutes: 60, seconds: 0 },
            ].map((preset) => (
              <Button
                key={preset.label}
                variant={minutes === preset.minutes && seconds === preset.seconds ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setMinutes(preset.minutes)
                  setSeconds(preset.seconds)
                }}
                className="h-9 text-sm font-medium"
              >
                {preset.label}m
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <Button
            onClick={handleApply}
            disabled={totalSeconds === 0}
            className="flex-1 h-11"
            size="lg"
          >
            Set Timer
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-11"
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  )
}
