import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
// Base styles are imported in index.css (before our theme overrides) so the
// app's teal theme wins the cascade.

import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

/**
 * react-day-picker styled to the app theme. Base layout comes from the
 * library stylesheet; colors/sizing are themed via CSS vars in index.css
 * (scoped to .rdp-root).
 */
export function Calendar({
  className,
  captionLayout = 'dropdown',
  startMonth,
  endMonth,
  ...props
}: CalendarProps) {
  const now = new Date()
  return (
    <DayPicker
      className={cn('rdp-root', className)}
      showOutsideDays
      captionLayout={captionLayout}
      startMonth={startMonth ?? new Date(now.getFullYear() - 6, 0)}
      endMonth={endMonth ?? new Date(now.getFullYear() + 1, 11)}
      components={{
        Chevron: ({ orientation, className: c, ...rest }) =>
          orientation === 'left' ? (
            <ChevronLeft className={cn('size-4', c)} {...rest} />
          ) : (
            <ChevronRight className={cn('size-4', c)} {...rest} />
          ),
      }}
      {...props}
    />
  )
}
