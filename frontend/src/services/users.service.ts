import { apiClient } from "@/lib/apiClient";
import type { PaginatedResponse, User } from "@/types/api.types";

export const usersService = {
  async list(params: { page?: number; limit?: number; role?: string } = {}) {
    const { data } = await apiClient.get<PaginatedResponse<User>>("/users", {
      params,
    });
    return data;
  },
  async agents() {
    const { data } = await apiClient.get<User[]>("/users/agents");
    return data;
  },
  async me() {
    const { data } = await apiClient.get<User>("/users/me");
    return data;
  },
  async update(id: string, input: Partial<User>) {
    const { data } = await apiClient.patch<User>(`/users/${id}`, input);
    return data;
  },
};
