import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed bg-muted/10">
      <CardContent className="flex flex-col items-center justify-center text-center py-12 px-6 space-y-4">
        <div className="bg-primary/10 p-3.5 rounded-full text-primary w-fit shadow-sm">
          {icon}
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actionLabel && (onAction || actionHref) && (
          <div className="pt-2">
            {actionHref ? (
              <Button asChild size="sm">
                <a href={actionHref}>{actionLabel}</a>
              </Button>
            ) : (
              <Button size="sm" onClick={onAction}>
                {actionLabel}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
