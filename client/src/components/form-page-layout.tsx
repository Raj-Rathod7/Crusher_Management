import { Button } from '#/components/ui/button'
import { Link } from '@tanstack/react-router'
import { IconArrowLeft } from '@tabler/icons-react'
import * as React from 'react'

type FormPageLayoutProps = {
  title?: string
  description?: string
  backLabel?: string
  backTo?: string
  badge?: string
  children: React.ReactNode
  sidebar?: React.ReactNode
  className?: string
}

export function FormPageLayout({
  title = 'Form',
  description,
  backLabel = 'Back',
  backTo = '/',
  badge,
  children,
  sidebar,
  className,
}: FormPageLayoutProps) {
  return (
    <div className={className || 'min-h-[calc(100vh-5rem)] bg-linear-to-b from-background via-background to-muted/20 p-6'}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          {badge && (
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
              {badge}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {backTo && (
          <Button asChild variant="outline" className="shadow-sm">
            <Link to={backTo}>
              <IconArrowLeft />
              {backLabel}
            </Link>
          </Button>
        )}
      </div>

      <div className={sidebar ? 'grid min-h-[calc(100vh-10rem)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]' : 'w-full'}>
        <div className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur-sm lg:p-7">
          {children}
        </div>

        {sidebar && (
          <aside className="h-fit rounded-2xl border border-border/80 bg-card/90 p-5 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.35)] lg:sticky lg:top-6">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  )
}
