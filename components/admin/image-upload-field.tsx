"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  uploadAction: (formData: FormData) => Promise<{ url?: string; error?: string }>;
  required?: boolean;
};

export function ImageUploadField({ uploadAction, required }: Props) {
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-foreground/20 bg-foreground/[0.02] p-4">
      <Label>
        Image {required && <span className="text-red-500">*</span>}
      </Label>
      <input type="hidden" name="imageUrl" value={imageUrl} required={required} />
      <input
        type="file"
        accept="image/*"
        className="block w-full text-sm"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setError(null);
          const fd = new FormData();
          fd.append("file", file);
          startTransition(async () => {
            const result = await uploadAction(fd);
            if (result.url) setImageUrl(result.url);
            else setError(result.error ?? "Upload failed");
          });
        }}
      />
      {isPending && (
        <p className="text-xs text-foreground/60">Uploading image…</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {imageUrl && (
        <div className="relative aspect-video max-h-48 w-full overflow-hidden rounded-md border">
          <Image
            src={imageUrl}
            alt="Uploaded preview"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      )}
      <div>
        <Label className="text-xs text-foreground/60">Or paste image URL</Label>
        <Input
          className="mt-1"
          placeholder="https://..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </div>
    </div>
  );
}
