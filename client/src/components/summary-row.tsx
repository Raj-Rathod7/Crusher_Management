import { Badge } from '#/components/ui/badge'

type SummaryRowProps = {
  label: string
  value: string
  isBadge?: boolean
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive'
  badgeClassName?: string
}

export function SummaryRow({
  label,
  value,
  isBadge = false,
  badgeVariant = 'outline',
  badgeClassName,
}: SummaryRowProps) {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 border-t py-3 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {isBadge ? (
        <Badge variant={badgeVariant} className={badgeClassName}>
          {value}
        </Badge>
      ) : (
        <span className="text-sm font-medium leading-5 wrap-break-word">{value}</span>
      )}
    </div>
  )
}
