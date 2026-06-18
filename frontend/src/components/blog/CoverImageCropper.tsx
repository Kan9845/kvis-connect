"use client";
import { useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Props {
  cropSrc: string | null;
  onClose: () => void;
  onDone: (file: File) => void;
}

async function getCroppedFile(cropSrc: string, croppedAreaPixels: Area): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = cropSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
      );
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject("Blob failed");
          resolve(new File([blob], "cover.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92,
      );
    };
    image.onerror = () => reject("Image load failed");
  });
}

export function CoverImageCropper({ cropSrc, onClose, onDone }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setApplying(true);
    try {
      const file = await getCroppedFile(cropSrc, croppedAreaPixels);
      onDone(file);
    } catch {
      // ignore
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={!!cropSrc} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg rounded-none p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[var(--kvis-border)]">
          <DialogTitle className="text-base font-bold uppercase tracking-[0.22em]">Crop cover image</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-5">
          <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "16/9" }}>
            {cropSrc && (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.22em] text-[var(--kvis-text3)] shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground">16:9 ratio — this is exactly how your cover will appear on the post.</p>
        </div>
        <DialogFooter className="px-6 pb-6 flex gap-3 flex-row justify-start">
          <Button
            type="button"
            disabled={applying}
            className="h-auto rounded-none bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2"
            onClick={handleApply}
          >
            <Check className="h-3.5 w-3.5" /> {applying ? "Applying..." : "Apply crop"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto rounded-none border-foreground/30 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em]"
            onClick={onClose}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}