import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  fieldsService,
  type CreateFieldInput,
  type FieldsListParams,
} from "@/services/fields.service";

export function useFields(params: FieldsListParams = {}) {
  return useQuery({
    queryKey: ["fields", params],
    queryFn: () => fieldsService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useFieldDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["fields", id],
    queryFn: () => fieldsService.get(id!),
    enabled: Boolean(id),
  });
}

export function useCreateField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFieldInput) => fieldsService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fields"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateField(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateFieldInput>) =>
      fieldsService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fields"] });
      qc.invalidateQueries({ queryKey: ["fields", id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useArchiveField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fieldsService.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fields"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
