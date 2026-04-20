import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/services/users.service'
import type { User } from '#/types/api.types'

export function useUsers(params: { page?: number; role?: string } = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersService.list(params),
  })
}

export function useAgents() {
  return useQuery({
    queryKey: ['users', 'agents'],
    queryFn: () => usersService.agents(),
  })
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersService.me(),
    enabled,
  })
}

export function useInviteUser() {
  return useMutation({
    mutationFn: (email: string) => usersService.invite(email),
  })
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<User>) => usersService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['users', id] })
      qc.invalidateQueries({ queryKey: ['users', 'agents'] })
    },
  })
}
