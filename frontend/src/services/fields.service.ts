import { apiClient } from "@/lib/apiClient";
import type {
  FieldDetail,
  FieldWithStatus,
  PaginatedResponse,
} from "@/types/api.types";

export interface FieldsListParams {
  page?: number;
  limit?: number;
  status?: string;
  stage?: string;
  county?: string;
  includeArchived?: boolean;
}

export interface CreateFieldInput {
  name: string;
  cropType: string;
  plantingDate: string;
  currentStage: "PLANTED" | "GROWING" | "READY" | "HARVESTED";
  agentId?: string | null;
  county: string;
  subCounty?: string | null;
  ward?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  areaSize?: number | null;
  description?: string | null;
  coverImageUrl?: string | null;
}

export const fieldsService = {
  async list(params: FieldsListParams = {}) {
    const { data } = await apiClient.get<PaginatedResponse<FieldWithStatus>>(
      "/fields",
      { params },
    );
    return data;
  },
  async get(id: string) {
    const { data } = await apiClient.get<FieldDetail>(`/fields/${id}`);
    return data;
  },
  async create(input: CreateFieldInput) {
    const { data } = await apiClient.post<FieldDetail>("/fields", input);
    return data;
  },
  async update(id: string, input: Partial<CreateFieldInput>) {
    const { data } = await apiClient.patch<FieldDetail>(`/fields/${id}`, input);
    return data;
  },
  async archive(id: string) {
    const { data } = await apiClient.delete<FieldDetail>(`/fields/${id}`);
    return data;
  },
};
