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
    mutationFn: ({
      email,
      inviteCode,
    }: {
      email: string
      inviteCode: string
    }) => usersService.invite(email, inviteCode),
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

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<User> }) =>
      usersService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['users', 'agents'] })
    },
  })
}
