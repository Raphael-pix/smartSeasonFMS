import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { imagesService } from "@/services/images.service";

export function useFieldImages(fieldId: string | undefined) {
  return useQuery({
    queryKey: ["fields", fieldId, "images"],
    queryFn: () => imagesService.list(fieldId!),
    enabled: Boolean(fieldId),
  });
}

export function useUploadImage(fieldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, caption }: { file: File; caption?: string }) =>
      imagesService.upload(fieldId, file, caption),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fields", fieldId, "images"] });
      qc.invalidateQueries({ queryKey: ["fields", fieldId] });
    },
  });
}

export function useDeleteImage(fieldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => imagesService.remove(fieldId, imageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fields", fieldId, "images"] });
    },
  });
}
