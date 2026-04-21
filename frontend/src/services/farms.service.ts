import { apiClient } from '@/lib/apiClient'
import type { Farm, FarmWithMembers } from '@/types/api.types'

export interface CreateFarmInput {
  name: string
  description?: string
  county?: string
}

export const farmsService = {
  async create(input: CreateFarmInput) {
    const { data } = await apiClient.post<Farm>('/farms', input)
    return data
  },
  async join(inviteCode: string) {
    const { data } = await apiClient.post<{
      message: string
      farm: Pick<Farm, 'id' | 'name' | 'slug'>
    }>('/farms/join', { inviteCode })
    return data
  },
  async mine() {
    const { data } = await apiClient.get<FarmWithMembers>('/farms/mine')
    return data
  },
  async update(input: Partial<CreateFarmInput>) {
    const { data } = await apiClient.patch<Farm>('/farms/mine', input)
    return data
  },
  async regenerateInvite() {
    const { data } = await apiClient.post<{
      inviteCode: string
      message: string
    }>('/farms/mine/invite-code')
    return data
  },
  async removeMember(memberId: string) {
    const { data } = await apiClient.delete<{ message: string }>(
      `/farms/mine/members/${memberId}`,
    )
    return data
  },
}
