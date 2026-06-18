import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple' | 'orange'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'border-transparent bg-primary text-primary-foreground': variant === 'default',
          'border-transparent bg-secondary text-secondary-foreground': variant === 'secondary',
          'border-transparent bg-destructive text-destructive-foreground': variant === 'destructive',
          'text-foreground': variant === 'outline',
          'border-transparent bg-blue-100 text-blue-700': variant === 'blue',
          'border-transparent bg-green-100 text-green-700': variant === 'green',
          'border-transparent bg-red-100 text-red-700': variant === 'red',
          'border-transparent bg-yellow-100 text-yellow-700': variant === 'yellow',
          'border-transparent bg-gray-100 text-gray-600': variant === 'gray',
          'border-transparent bg-purple-100 text-purple-700': variant === 'purple',
          'border-transparent bg-orange-100 text-orange-700': variant === 'orange',
        },
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
