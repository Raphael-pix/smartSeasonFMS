import { apiClient } from "@/lib/apiClient";
import type {
  CropStage,
  FieldUpdate,
  PaginatedResponse,
} from "@/types/api.types";

export interface CreateUpdateInput {
  stage: CropStage;
  notes?: string | null;
  imageUrl?: string | null;
  observedAt: string;
}

export const updatesService = {
  async list(fieldId: string, params: { page?: number; limit?: number } = {}) {
    const { data } = await apiClient.get<PaginatedResponse<FieldUpdate>>(
      `/fields/${fieldId}/updates`,
      { params },
    );
    return data;
  },
  async create(fieldId: string, input: CreateUpdateInput) {
    const { data } = await apiClient.post<FieldUpdate>(
      `/fields/${fieldId}/updates`,
      input,
    );
    return data;
  },
};
