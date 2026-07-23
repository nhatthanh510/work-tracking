import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  checkInToday,
  checkOutToday,
  saveEntry,
  deleteEntry,
} from '@/lib/api'
import { ENTRIES_ROOT } from '@/lib/queryClient'
import type { EntryInput } from '@/lib/types'

/**
 * Entry mutations. Each one invalidates every entries query on success, so the
 * Today panel, stats, and Records table all refresh from the cache.
 */
export function useEntryMutations() {
  const qc = useQueryClient()
  const onSuccess = () => qc.invalidateQueries({ queryKey: ENTRIES_ROOT })

  const checkIn = useMutation({ mutationFn: checkInToday, onSuccess })
  const checkOut = useMutation({ mutationFn: checkOutToday, onSuccess })
  const save = useMutation({
    mutationFn: (input: EntryInput) => saveEntry(input),
    onSuccess,
  })
  const remove = useMutation({
    mutationFn: (id: string) => deleteEntry(id),
    onSuccess,
  })

  return { checkIn, checkOut, save, remove }
}
