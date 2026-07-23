import { useQuery } from '@tanstack/react-query'
import { listEntries } from '@/lib/api'
import { entriesKey } from '@/lib/queryClient'
import type { DateRange } from '@/lib/types'

/**
 * Entries for a date range, backed by TanStack Query. Caching, dedupe, and
 * fetching state are handled by the query cache — no local state needed.
 *   - `loading`  : first load for this range (no cached data yet) → skeleton
 *   - `fetching` : any in-flight fetch (incl. background refetch)
 */
export function useEntries(range: DateRange) {
  const query = useQuery({
    queryKey: entriesKey(range.from, range.to),
    queryFn: () => listEntries(range),
  })

  return {
    entries: query.data ?? [],
    loading: query.isPending,
    fetching: query.isFetching,
    error: query.isError
      ? query.error instanceof Error
        ? query.error.message
        : 'Failed to load entries.'
      : null,
  }
}
