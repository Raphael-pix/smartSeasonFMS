import { apiClient } from '@/lib/apiClient'
import type { FieldImage } from '@/types/api.types'

export const imagesService = {
  async list(fieldId: string) {
    const { data } = await apiClient.get<FieldImage[]>(
      `/fields/${fieldId}/images`,
    )
    return data
  },
  async upload(fieldId: string, file: File, caption?: string) {
    const fd = new FormData()
    fd.append('file', file)
    if (caption) fd.append('caption', caption)
    const { data } = await apiClient.post<FieldImage>(
      `/fields/${fieldId}/images`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  },
  async getUploadUrl(fieldId: string, fileName: string) {
    const { data } = await apiClient.post(
      `/fields/${fieldId}/images/upload-url`,
      {
        fileName,
      },
    )
    return data
  },
  async confirmUpload(
    fieldId: string,
    payload: {
      path: string
      caption?: string
      setCover?: boolean
    },
  ) {
    const { data } = await apiClient.post<FieldImage>(
      `/fields/${fieldId}/images/confirm`,
      payload,
    )
    return data
  },
  async uploadToSupabase(uploadUrl: string, file: File) {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    })

    if (!res.ok) {
      throw new Error('Upload to storage failed')
    }

    return true
  },
  async remove(fieldId: string, imageId: string) {
    const { data } = await apiClient.delete<{ message: string }>(
      `/fields/${fieldId}/images/${imageId}`,
    )
    return data
  },
}
