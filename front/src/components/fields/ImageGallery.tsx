import { useRef, useState } from "react";
import { Trash2, Upload, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useDeleteImage,
  useFieldImages,
  useUploadImage,
} from "@/hooks/useImages";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";
import { formatDate } from "@/lib/format";

const MAX_BYTES = 5 * 1024 * 1024;

export function ImageGallery({ fieldId }: { fieldId: string }) {
  const role = useAuthStore((s) => s.role);
  const { data, isLoading } = useFieldImages(fieldId);
  const upload = useUploadImage(fieldId);
  const remove = useDeleteImage(fieldId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        toast.error(`${file.name}: must be JPEG, PNG, or WebP`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: exceeds 5MB`);
        continue;
      }
      try {
        await upload.mutateAsync({ file });
        toast.success(`Uploaded ${file.name}`);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : `Failed to upload ${file.name}`,
        );
      }
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary-soft"
            : "border-border bg-muted/30"
        }`}
      >
        <ImagePlus className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag images here, or click to browse (JPEG/PNG/WebP, max 5MB)
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          {upload.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No images yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data!.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-card"
            >
              <img
                src={img.url}
                alt={img.caption ?? "Field image"}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <div className="space-y-0.5 p-2 text-xs">
                {img.caption && (
                  <p className="line-clamp-1 font-medium text-foreground">
                    {img.caption}
                  </p>
                )}
                <p className="text-muted-foreground">
                  {img.uploadedBy?.fullName ?? "—"} ·{" "}
                  {formatDate(img.createdAt)}
                </p>
              </div>
              {role === "ADMIN" && (
                <button
                  onClick={() => remove.mutate(img.id)}
                  className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Delete image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
