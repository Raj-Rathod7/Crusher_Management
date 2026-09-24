import * as React from "react"
import { IconCalendar } from "@tabler/icons-react"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type DateRangeValue = { from: Date; to: Date }

type Preset = { label: string; getRange: () => DateRangeValue }

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function daysAgo(days: number) {
  const d = startOfDay(new Date())
  d.setDate(d.getDate() - days)
  return d
}

const PRESETS: Preset[] = [
  { label: "7d", getRange: () => ({ from: daysAgo(6), to: startOfDay(new Date()) }) },
  { label: "30d", getRange: () => ({ from: daysAgo(29), to: startOfDay(new Date()) }) },
  {
    label: "This month",
    getRange: () => {
      const now = new Date()
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: startOfDay(now) }
    },
  },
]

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" })

type DateRangePickerProps = Readonly<{
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  className?: string
}>

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const activePreset = PRESETS.find((preset) => {
    const range = preset.getRange()
    return (
      startOfDay(range.from).getTime() === startOfDay(value.from).getTime() &&
      startOfDay(range.to).getTime() === startOfDay(value.to).getTime()
    )
  })

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {PRESETS.map((preset) => (
        <Button
          key={preset.label}
          type="button"
          size="sm"
          variant={activePreset?.label === preset.label ? "default" : "outline"}
          onClick={() => onChange(preset.getRange())}
        >
          {preset.label}
        </Button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" size="sm" variant="outline">
            <IconCalendar />
            {dateFormatter.format(value.from)} – {dateFormatter.format(value.to)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            defaultMonth={value.from}
            selected={{ from: value.from, to: value.to }}
            onSelect={(range: DateRange | undefined) => {
              if (range?.from && range?.to) {
                onChange({ from: startOfDay(range.from), to: startOfDay(range.to) })
                setOpen(false)
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
