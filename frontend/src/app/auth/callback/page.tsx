"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, GraduationCap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AuthCallbackPage() {
  const { user, refetch } = useAuth();
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    refetch().finally(() => setDone(true));
  }, []);

  useEffect(() => {
    if (!done) return;

    if (!user) {
      toast({ title: "Sign-in failed. Please try again.", variant: "destructive" });
      router.replace("/auth/login");
      return;
    }

    router.replace(user.kvis_year ? "/" : "/edit");
  }, [done, user, router]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2 text-primary font-bold text-xl">
        <GraduationCap className="h-7 w-7" />
        KVIS Connect
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}
