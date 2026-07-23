import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/** Query key for entry lists. Invalidate the whole prefix after any mutation. */
export const entriesKey = (from: string, to: string) =>
  ['entries', from, to] as const
export const ENTRIES_ROOT = ['entries'] as const
