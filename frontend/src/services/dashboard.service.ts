import { apiClient } from "@/lib/apiClient";
import type { AdminDashboard, AgentDashboard } from "@/types/api.types";

export const dashboardService = {
  async admin() {
    const { data } = await apiClient.get<AdminDashboard>("/dashboard/admin");
    return data;
  },
  async agent() {
    const { data } = await apiClient.get<AgentDashboard>("/dashboard/agent");
    return data;
  },
};
