'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/flow-ai/cn'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center space-y-4",
      className
    )}>
      {icon && (
        <div className="text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}








