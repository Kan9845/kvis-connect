"use client";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useRef } from "react";
import type { UserMe } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Upload, Check } from "lucide-react";
import { AvatarCustomizer } from "@/components/avatar/AvatarCustomizer";
import { AvatarCanvas } from "@/components/avatar/AvatarCanvas";
import { AvatarConfig } from "@/lib/avatarTypes";
import { cohortColorHex } from "@/lib/utils";
import { userApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { onMeUpdateSuccess } from "@/lib/cache/invalidate";
import { SectionHead } from "./components";

interface TabPhotoProps {
  me: UserMe;
  refetch: () => Promise<void>;
  notify: { success: (msg: string) => void; error: (msg: string) => void };
  cropSrc: string | null;
  setCropSrc: React.Dispatch<React.SetStateAction<string | null>>;
  crop: { x: number; y: number };
  setCrop: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  croppedAreaPixels: Area | null;
  setCroppedAreaPixels: React.Dispatch<React.SetStateAction<Area | null>>;
  picPreview: string | null;
  setPicPreview: React.Dispatch<React.SetStateAction<string | null>>;
  pendingFile: File | null;
  setPendingFile: React.Dispatch<React.SetStateAction<File | null>>;
  profileMode: "upload" | "goose";
  setProfileMode: React.Dispatch<React.SetStateAction<"upload" | "goose">>;
  gooseConfig: AvatarConfig;
  setGooseConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  avatarRef: React.RefObject<HTMLDivElement>;
  getCroppedFile: () => Promise<File>;
  handleUseGooseProfile: () => Promise<void>;
  handlePicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TabPhoto({
  me,
  refetch,
  notify,
  cropSrc,
  setCropSrc,
  crop,
  setCrop,
  zoom,
  setZoom,
  croppedAreaPixels,
  setCroppedAreaPixels,
  picPreview,
  setPicPreview,
  pendingFile,
  setPendingFile,
  profileMode,
  setProfileMode,
  gooseConfig,
  setGooseConfig,
  avatarRef,
  getCroppedFile,
  handleUseGooseProfile,
  handlePicChange,
}: TabPhotoProps) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = `${me.first_name[0] ?? ""}${me.last_name[0] ?? ""}`.toUpperCase();
  const previewUrl = picPreview ?? me.profile_pic_url ?? "";

  return (
    <section>
      <SectionHead numeral="I." kicker="Portrait" title="Profile picture" />

      {/* Crop dialog */}
      <Dialog open={!!cropSrc} onOpenChange={(open) => { if (!open) setCropSrc(null); }}>
        <DialogContent className="max-w-lg rounded-none p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-[var(--kvis-border)]">
            <DialogTitle className="text-base font-bold uppercase tracking-[0.22em]">Crop photo</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <div className="relative w-full h-72 bg-muted overflow-hidden">
              {cropSrc && (
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
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
          </div>
          <DialogFooter className="px-6 pb-6 flex gap-3 flex-row justify-start">
            <Button
              type="button"
              className="h-auto rounded-none bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2"
              onClick={async () => {
                try {
                  const file = await getCroppedFile();
                  setPendingFile(file);
                  setPicPreview(URL.createObjectURL(file));
                  setCropSrc(null);
                } catch {
                  notify.error("Crop failed");
                }
              }}
            >
              <Check className="h-3.5 w-3.5" /> Apply crop
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto rounded-none border-foreground/30 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em]"
              onClick={() => setCropSrc(null)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-section py-lg border-b border-[var(--kvis-border)] items-start">
        <div className="space-y-lg self-start hidden lg:flex lg:flex-col lg:items-center">
          <div className="relative w-full max-w-[320px] mx-auto">
            {profileMode === "goose" ? (
              <div
                key={profileMode}
                ref={avatarRef}
                className="relative w-full overflow-hidden rounded-full"
              >
                <AvatarCanvas config={gooseConfig} backgroundColor="var(--kvis-green)" />
              </div>
            ) : previewUrl ? (
              <div
                key="upload-photo"
                className="relative w-full overflow-hidden"
                style={{ paddingBottom: "100%", background: cohortColorHex(me.kvis_year) }}
              >
                <img
                  src={previewUrl}
                  alt={`${me.first_name} ${me.last_name}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            ) : me.goose_config ? (
              <div
                key="upload-goose"
                className="relative w-full overflow-hidden rounded-full"
              >
                <AvatarCanvas config={gooseConfig} backgroundColor="var(--kvis-green)" />
              </div>
            ) : (
              <div
                key="upload-initials"
                className="relative w-full overflow-hidden"
                style={{ paddingBottom: "100%", background: cohortColorHex(me.kvis_year) }}
              >
                <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-white">
                  {initials}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-2xl space-y-xl">
          <div className="flex items-center gap-7 border-b border-[var(--sep-strong)]">
            {(["upload", "goose"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setProfileMode(mode)}
                className={`px-0 py-2 text-xs font-bold uppercase tracking-[0.28em] whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  profileMode === mode
                    ? "text-[var(--kvis-purple)] border-b-4 border-[var(--kvis-purple)]"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                {mode === "upload" ? "Upload Photo" : "Goose Profile"}
              </button>
            ))}
          </div>

          {/* Mobile pfp preview - below tabs, replaces left column */}
          <div className="lg:hidden flex justify-center py-2">
            <div className="relative w-48 h-48">
              {profileMode === "goose" ? (
                <div className="relative w-full overflow-hidden rounded-full">
                  <AvatarCanvas config={gooseConfig} backgroundColor="var(--kvis-green)" />
                </div>
              ) : previewUrl ? (
                <div className="relative w-full overflow-hidden" style={{ paddingBottom: "100%", background: cohortColorHex(me.kvis_year) }}>
                  <img src={previewUrl} alt={`${me.first_name} ${me.last_name}`} className="absolute inset-0 h-full w-full object-cover" />
                </div>
              ) : me.goose_config ? (
                <div className="relative w-full overflow-hidden rounded-full">
                  <AvatarCanvas config={gooseConfig} backgroundColor="var(--kvis-green)" />
                </div>
              ) : (
                <div className="relative w-full overflow-hidden" style={{ paddingBottom: "100%", background: cohortColorHex(me.kvis_year) }}>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-white">{initials}</div>
                </div>
              )}
            </div>
          </div>

          {profileMode === "goose" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black tracking-tight mb-2">Customize your goose</h3>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  Create a playful illustrated profile avatar.
                </p>
              </div>
              <div className="max-w-xl">
                <AvatarCustomizer value={gooseConfig} onChange={setGooseConfig} />
              </div>
            </div>
          )}

          {profileMode === "upload" && (
            <div>
              <h3 className="text-xl font-black tracking-tight mb-2">Upload a profile photo</h3>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                JPG or PNG. Square images work best.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="button"
              className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 disabled:opacity-40 gap-2"
              onClick={async () => {
                if (profileMode === "goose") {
                  await handleUseGooseProfile();
                } else if (pendingFile) {
                  try {
                    const { url } = await userApi.uploadProfilePic(pendingFile);
                    const updated = await userApi.updateMe({ profile_pic_url: url, goose_config: null as any });
                    onMeUpdateSuccess(qc, updated);
                    await refetch();
                    setPicPreview(url);
                    setPendingFile(null);
                    notify.success("Profile picture updated");
                  } catch {
                    notify.error("Upload failed");
                  }
                }
              }}
              disabled={profileMode === "upload" && !pendingFile}
            >
              {profileMode === "goose" ? "Save goose profile" : "Save photo"}
            </Button>
            {profileMode === "upload" && (
              <label className="inline-flex items-center gap-2 cursor-pointer px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] border border-foreground/30 text-foreground hover:bg-foreground hover:text-background transition-colors">
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePicChange} />
                <Upload className="h-3.5 w-3.5" /> Choose file
              </label>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
