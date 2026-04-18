import { apiClient } from "@/lib/apiClient";
import type { FieldImage } from "@/types/api.types";

export const imagesService = {
  async list(fieldId: string) {
    const { data } = await apiClient.get<FieldImage[]>(
      `/fields/${fieldId}/images`,
    );
    return data;
  },
  async upload(fieldId: string, file: File, caption?: string) {
    const fd = new FormData();
    fd.append("file", file);
    if (caption) fd.append("caption", caption);
    const { data } = await apiClient.post<FieldImage>(
      `/fields/${fieldId}/images`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },
  async remove(fieldId: string, imageId: string) {
    const { data } = await apiClient.delete<{ message: string }>(
      `/fields/${fieldId}/images/${imageId}`,
    );
    return data;
  },
};
