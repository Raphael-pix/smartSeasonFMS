import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { imagesService } from '@/services/images.service'

export function useFieldImages(fieldId: string | undefined) {
  return useQuery({
    queryKey: ['fields', fieldId, 'images'],
    queryFn: () => imagesService.list(fieldId!),
    enabled: Boolean(fieldId),
  })
}

export function useDeleteImage(fieldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (imageId: string) => imagesService.remove(fieldId, imageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fields', fieldId, 'images'] })
    },
  })
}

type UploadInput = {
  fieldId: string
  file: File
  caption?: string
  setCover?: boolean
}

export function useUploadImage(fieldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UploadInput) => {
      const { uploadUrl, path } = await imagesService.getUploadUrl(
        input.fieldId,
        input.file.name,
      )

      await imagesService.uploadToSupabase(uploadUrl, input.file)

      return imagesService.confirmUpload(input.fieldId, {
        path,
        caption: input.caption,
        setCover: input.setCover,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fields', fieldId, 'images'] })
      qc.invalidateQueries({ queryKey: ['fields', fieldId] })
    },
  })
}
