import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["dashboard", "ADMIN"],
    queryFn: () => dashboardService.admin(),
    refetchInterval: 2 * 60_000,
    staleTime: 30_000,
  });
}

export function useAgentDashboard() {
  return useQuery({
    queryKey: ["dashboard", "AGENT"],
    queryFn: () => dashboardService.agent(),
    refetchInterval: 2 * 60_000,
    staleTime: 30_000,
  });
}
