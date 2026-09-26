export type QuickPeriod = 'all' | 'today' | 'week' | 'month'

export const QUICK_PERIODS: readonly QuickPeriod[] = ['all', 'today', 'week', 'month']

export const QUICK_PERIOD_LABELS: Record<QuickPeriod, string> = {
  all: 'All time',
  today: 'Today',
  week: 'This week',
  month: 'This month',
}

/** Formats a Date as 'yyyy-MM-dd' using the local calendar date (no UTC shift). */
export function dateKey(date: Date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function startOfWeek(date: Date) {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  start.setHours(0, 0, 0, 0)
  return start
}

/** Checks whether a 'yyyy-MM-dd' date string falls within an inclusive from/to range; no range matches all. */
export function matchesRange(dateStr: string, range?: { from: Date; to: Date }): boolean {
  if (!range) return true
  if (!dateStr) return false
  const key = dateStr.slice(0, 10)
  return key >= dateKey(range.from) && key <= dateKey(range.to)
}

/** Checks whether a 'yyyy-MM-dd' date string falls within the given quick period, relative to now. */
export function matchesPeriod(dateStr: string, period: QuickPeriod): boolean {
  if (period === 'all' || !dateStr) return true
  const date = new Date(`${dateStr}T00:00:00`)
  const now = new Date()
  if (period === 'today') return dateKey(date) === dateKey(now)
  if (period === 'week') return date >= startOfWeek(now) && date <= now
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}
