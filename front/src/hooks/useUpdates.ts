import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { updatesService } from '@/services/updates.service'
import type { CreateUpdateInput } from '@/services/updates.service'
import { useAuthStore } from '@/stores/authStore'

export function useFieldUpdates(fieldId: string | undefined, page = 1) {
  return useQuery({
    queryKey: ['fields', fieldId, 'updates', { page }],
    queryFn: () => updatesService.list(fieldId!, { page, limit: 20 }),
    enabled: Boolean(fieldId),
  })
}

export function useCreateUpdate(fieldId: string) {
  const qc = useQueryClient()
  const role = useAuthStore((s) => s.role)
  return useMutation({
    mutationFn: (input: CreateUpdateInput) =>
      updatesService.create(fieldId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fields', fieldId] })
      qc.invalidateQueries({ queryKey: ['fields', fieldId, 'updates'] })
      qc.invalidateQueries({ queryKey: ['fields'] })
      qc.invalidateQueries({ queryKey: ['dashboard', role] })
    },
  })
}
