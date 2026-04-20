import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAgents } from '@/hooks/useUsers'
import { useUpdateField } from '@/hooks/useFields'
import type { FieldDetail, User } from '@/types/api.types'
import { useEffect } from 'react'

const schema = z.object({
  name: z.string().min(2, 'Field name is required'),
  cropType: z.string().min(2, 'Crop type is required'),
  currentStage: z.enum(['PLANTED', 'GROWING', 'READY', 'HARVESTED']),
  agentId: z.string().optional(),
  areaSize: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Number(v)), { message: 'Must be a number' }),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type UpdateFieldDialogProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
  field: FieldDetail | null
}

export function UpdateFieldDialog({
  open,
  onOpenChange,
  field,
}: UpdateFieldDialogProps) {
  const { data: agents } = useAgents()
  if (!field) return
  const updateMutation = useUpdateField(field.id)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      reset({
        name: field.name,
        cropType: field.cropType,
        currentStage: field.currentStage,
        agentId: field.agent?.id ?? '',
        areaSize: field.areaSize?.toString() ?? '',
        description: field.description ?? '',
      })
    }
  }, [field, open, reset])

  const currentStage = useWatch({ control, name: 'currentStage' })
  const agentId = useWatch({ control, name: 'agentId' })

  const onSubmit = async (values: FormValues) => {
    try {
      await updateMutation.mutateAsync({
        name: values.name,
        cropType: values.cropType,
        currentStage: values.currentStage,
        agentId: values.agentId || null,
        areaSize: values.areaSize ? Number(values.areaSize) : null,
        description: values.description || null,
      })

      toast.success('Field updated successfully')
      onOpenChange(false)
    } catch (e) {
      toast.error('Failed to update field')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update field</DialogTitle>
          <DialogDescription>
            Modify field details and assign or reassign an agent.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Field label="Field name" error={errors.name?.message}>
            <Input {...register('name')} />
          </Field>

          <Field label="Crop type" error={errors.cropType?.message}>
            <Input {...register('cropType')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage">
              <Select
                value={currentStage}
                onValueChange={(v) =>
                  setValue('currentStage', v as FormValues['currentStage'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANTED">Planted</SelectItem>
                  <SelectItem value="GROWING">Growing</SelectItem>
                  <SelectItem value="READY">Ready</SelectItem>
                  <SelectItem value="HARVESTED">Harvested</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Area size (acres)" error={errors.areaSize?.message}>
              <Input type="number" step="0.1" {...register('areaSize')} />
            </Field>
          </div>

          <Field label="Assign agent">
            <Select
              value={agentId ?? ''}
              onValueChange={(v) =>
                setValue('agentId', v === '__none__' ? '' : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {agents?.map((a: User) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.fullName ?? a.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Description">
            <Textarea rows={3} {...register('description')} />
          </Field>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update field'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
