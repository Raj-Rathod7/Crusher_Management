import * as React from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type StatsCardProps = Readonly<{
  title: React.ReactNode
  value: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}>

export function StatsCard({
  title,
  value,
  description,
  footer,
  icon,
  className,
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          {icon}
          {title}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
      </CardHeader>
      {description ? <CardContent>{description}</CardContent> : null}
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  )
}

type FilterChipProps = Readonly<{
  title: React.ReactNode
  value: React.ReactNode
  icon?: React.ReactNode
  active?: boolean
  onClick: () => void
}>

export function FilterChip({
  title,
  value,
  icon,
  active = false,
  onClick,
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-left text-sm text-card-foreground transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active && 'border-primary bg-primary/10 ring-1 ring-primary/50 hover:bg-primary/15',
      )}
    >
      {icon ? <span className="size-4 text-muted-foreground">{icon}</span> : null}
      <span className="font-medium">{title}</span>
      <span className="font-mono text-xs font-semibold tabular-nums">{value}</span>
    </button>
  )
}