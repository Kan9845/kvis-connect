import html2canvas from "html2canvas";
import { AvatarConfig } from "./avatarTypes";

export async function avatarConfigToFile(
  _config: AvatarConfig
): Promise<File> {
  const preview = document.getElementById("goose-avatar-preview");

  if (!preview) {
    throw new Error("Preview not found");
  }

  const canvas = await html2canvas(preview, {
    backgroundColor: null,
    scale: 2,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Blob generation failed"));
        return;
      }

      resolve(
        new File([blob], "goose-profile.png", {
          type: "image/png",
        })
      );
    });
  });
}