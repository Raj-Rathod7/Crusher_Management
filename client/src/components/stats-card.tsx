import * as React from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type StatsCardProps = {
  title: React.ReactNode
  value: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

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