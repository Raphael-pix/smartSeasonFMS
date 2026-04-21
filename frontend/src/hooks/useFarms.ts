import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { farmsService } from '@/services/farms.service'
import type { CreateFarmInput } from '@/services/farms.service'
import { usersService } from '@/services/users.service'
import { useAuthStore } from '@/stores/authStore'

export function useMyFarm(enabled = true) {
  return useQuery({
    queryKey: ['farm', 'mine'],
    queryFn: () => farmsService.mine(),
    enabled,
    retry: (count, err) => {
      const status = (err as { response?: { status?: number } }).response
        ?.status
      if (status === 403 || status === 401) return false
      return count < 2
    },
  })
}

export function useCreateFarm() {
  const qc = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (input: CreateFarmInput) => farmsService.create(input),
    onSuccess: async () => {
      try {
        const me = await usersService.me()

        qc.setQueryData(['users', 'me'], me)

        setUser(me)
      } catch {
        qc.invalidateQueries({ queryKey: ['users', 'me'] })
      }

      qc.invalidateQueries({ queryKey: ['farm'] })
    },
  })
}

export function useJoinFarm() {
  const qc = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (inviteCode: string) => farmsService.join(inviteCode),
    onSuccess: async () => {
      try {
        const me = await usersService.me()

        qc.setQueryData(['users', 'me'], me)

        setUser(me)
      } catch {
        qc.invalidateQueries({ queryKey: ['users', 'me'] })
      }
      qc.invalidateQueries({ queryKey: ['farm'] })
    },
  })
}

export function useUpdateFarm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<CreateFarmInput>) => farmsService.update(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farm'] }),
  })
}

export function useRegenerateInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => farmsService.regenerateInvite(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farm'] }),
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => farmsService.removeMember(memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farm'] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
