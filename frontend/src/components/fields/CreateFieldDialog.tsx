import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgents } from "@/hooks/useUsers";
import { useCreateField } from "@/hooks/useFields";

const schema = z.object({
  name: z.string().min(2, "Field name is required"),
  cropType: z.string().min(2, "Crop type is required"),
  plantingDate: z.string().min(1, "Planting date is required"),
  currentStage: z.enum(["PLANTED", "GROWING", "READY", "HARVESTED"]),
  agentId: z.string().optional(),
  county: z.string().min(2, "County is required"),
  subCounty: z.string().optional(),
  ward: z.string().optional(),
  areaSize: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Number(v)), { message: "Must be a number" }),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateFieldDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: agents } = useAgents();
  const createMutation = useCreateField();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentStage: "PLANTED",
      plantingDate: new Date().toISOString().slice(0, 10),
    },
  });

  const currentStage = useWatch({
    control: control,
    name: "currentStage",
  });
  const agentId = useWatch({
    control: control,
    name: "agentId",
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        cropType: values.cropType,
        plantingDate: values.plantingDate,
        currentStage: values.currentStage,
        agentId: values.agentId || null,
        county: values.county,
        subCounty: values.subCounty || null,
        ward: values.ward || null,
        areaSize: values.areaSize ? Number(values.areaSize) : null,
        description: values.description || null,
      });
      toast.success("Field created");
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create field");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create new field</DialogTitle>
          <DialogDescription>
            Add a new field and optionally assign it to an agent.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Field label="Field name" error={errors.name?.message}>
            <Input placeholder="e.g. Kiptoo North Plot" {...register("name")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Crop type" error={errors.cropType?.message}>
              <Input placeholder="Maize" {...register("cropType")} />
            </Field>
            <Field label="Planting date" error={errors.plantingDate?.message}>
              <Input type="date" {...register("plantingDate")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage">
              <Select
                value={currentStage}
                onValueChange={(v) =>
                  setValue("currentStage", v as FormValues["currentStage"])
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
              <Input
                type="number"
                step="0.1"
                placeholder="2.5"
                {...register("areaSize")}
              />
            </Field>
          </div>

          <Field label="Assign agent">
            <Select
              value={agentId ?? ""}
              onValueChange={(v) =>
                setValue("agentId", v === "__none__" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {agents?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.fullName ?? a.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="County" error={errors.county?.message}>
              <Input placeholder="Nakuru" {...register("county")} />
            </Field>
            <Field label="Sub-county">
              <Input {...register("subCounty")} />
            </Field>
            <Field label="Ward">
              <Input {...register("ward")} />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              rows={3}
              placeholder="Notes about soil, irrigation, etc."
              {...register("description")}
            />
          </Field>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create field
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
