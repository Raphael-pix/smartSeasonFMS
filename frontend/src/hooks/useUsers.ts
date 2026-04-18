import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";

export function useUsers(params: { page?: number; role?: string } = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => usersService.list(params),
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ["users", "agents"],
    queryFn: () => usersService.agents(),
  });
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: () => usersService.me(),
    enabled,
  });
}
