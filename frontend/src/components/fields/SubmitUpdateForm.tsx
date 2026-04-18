import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CloudOff, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateUpdate } from "@/hooks/useUpdates";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useOfflineQueueStore } from "@/stores/offlineQueueStore";
import type { CropStage } from "@/types/api.types";

const schema = z.object({
  stage: z.enum(["PLANTED", "GROWING", "READY", "HARVESTED"]),
  notes: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  observedAt: z.string().min(1, "Observation time is required"),
});

type FormValues = z.infer<typeof schema>;

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function SubmitUpdateForm({
  fieldId,
  defaultStage,
}: {
  fieldId: string;
  defaultStage: CropStage;
}) {
  const online = useOnlineStatus();
  const addToQueue = useOfflineQueueStore((s) => s.addToQueue);
  const createMutation = useCreateUpdate(fieldId);

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
      stage: defaultStage,
      observedAt: nowLocal(),
    },
  });

  const stage = useWatch({
    control: control,
    name: "stage",
  });

  const onSubmit = async (values: FormValues) => {
    const payload = {
      stage: values.stage,
      notes: values.notes || null,
      imageUrl: values.imageUrl || null,
      observedAt: new Date(values.observedAt).toISOString(),
    };
    if (!online) {
      addToQueue({
        fieldId,
        stage: payload.stage,
        notes: payload.notes ?? undefined,
        imageUrl: payload.imageUrl ?? undefined,
        observedAt: payload.observedAt,
      });
      toast.success("Saved offline — will sync when online");
      reset({ stage: defaultStage, observedAt: nowLocal() });
      return;
    }
    try {
      await createMutation.mutateAsync(payload);
      toast.success("Update submitted");
      reset({ stage: defaultStage, observedAt: nowLocal() });
    } catch (e) {
      // On failure, queue it
      addToQueue({
        fieldId,
        stage: payload.stage,
        notes: payload.notes ?? undefined,
        imageUrl: payload.imageUrl ?? undefined,
        observedAt: payload.observedAt,
      });
      toast.error(
        (e instanceof Error ? e.message : "Submission failed") +
          " — saved offline.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!online && (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning-soft p-3 text-xs text-warning-foreground">
          <CloudOff className="h-4 w-4" /> You're offline. Updates will be
          queued and submitted automatically when you reconnect.
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Crop stage</Label>
        <Select
          value={stage}
          onValueChange={(v) => setValue("stage", v as CropStage)}
        >
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PLANTED">Planted</SelectItem>
            <SelectItem value="GROWING">Growing</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="HARVESTED">Harvested</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea
          rows={4}
          placeholder="What did you observe today?"
          {...register("notes")}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Image URL (optional)</Label>
        <Input
          placeholder="https://…"
          inputMode="url"
          {...register("imageUrl")}
        />
        {errors.imageUrl && (
          <p className="text-xs text-destructive">{errors.imageUrl.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Observed at</Label>
        <Input
          type="datetime-local"
          {...register("observedAt")}
          className="h-11"
        />
        {errors.observedAt && (
          <p className="text-xs text-destructive">
            {errors.observedAt.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="h-11 w-full text-base"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Submit update
      </Button>
    </form>
  );
}
