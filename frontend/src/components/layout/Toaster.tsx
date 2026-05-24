"use client";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "rounded-none border border-foreground/20 bg-background text-foreground text-xs font-bold uppercase tracking-[0.18em]",
          description: "text-muted-foreground normal-case tracking-normal font-normal text-xs",
          actionButton: "rounded-none",
          cancelButton: "rounded-none",
          error: "border-red-500/40",
          success: "border-foreground/20",
        },
      }}
    />
  );
}
