"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { userApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, Loader2, Check, ShieldCheck, ShieldAlert } from "lucide-react";
import { DEGREES, JOB_FIELDS, MAJORS, MBTI_TYPES, KVIS_YEARS } from "@/lib/constants/options";
import { COUNTRIES } from "@/lib/constants/countries";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Education, Career } from "@/lib/types";

const generalSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  kvis_year: z.coerce.number().optional(),
  place: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().max(500).optional(),
  mbti: z.string().optional(),
  interests: z.string().optional(),
  facebook_url: z.string().optional(),
  linkedin_url: z.string().optional(),
  line_id: z.string().optional(),
  website_url: z.string().optional(),
});

type GeneralForm = z.infer<typeof generalSchema>;

export default function EditPage() {
  const router = useRouter();
  const { user: me, loading, refetch } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [picPreview, setPicPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !me) router.push("/auth/login");
  }, [loading, me, router]);

  // General form
  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty, isSubmitting } } = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    values: me ? {
      first_name: me.first_name,
      last_name: me.last_name,
      kvis_year: me.kvis_year ?? undefined,
      place: me.place ?? "",
      country: me.country ?? "",
      bio: me.bio ?? "",
      mbti: me.mbti ?? "",
      interests: me.interests ?? "",
      facebook_url: me.facebook_url ?? "",
      linkedin_url: me.linkedin_url ?? "",
      line_id: me.line_id ?? "",
      website_url: me.website_url ?? "",
    } : undefined,
  });

  // Education state
  const [education, setEducation] = useState<Omit<Education, "id">[]>([]);
  const [career, setCareer] = useState<Omit<Career, "id">[]>([]);

  useEffect(() => {
    if (me) {
      setEducation(me.education.map(({ id, ...rest }) => rest));
      setCareer(me.career.map(({ id, ...rest }) => rest));
    }
  }, [me]);

  const saveGeneral = async (data: GeneralForm) => {
    await userApi.updateMe(data);
    await refetch();
    toast({ title: "Profile updated" });
  };

  const saveEducation = async () => {
    await userApi.updateEducation(education);
    await refetch();
    toast({ title: "Education saved" });
  };

  const saveCareer = async () => {
    await userApi.updateCareer(career);
    await refetch();
    toast({ title: "Career saved" });
  };

  const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicPreview(URL.createObjectURL(file));
    try {
      const { url } = await userApi.uploadProfilePic(file);
      await userApi.updateMe({ profile_pic_url: url });
      await refetch();
      toast({ title: "Profile picture updated" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  if (loading || !me) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const initials = `${me.first_name[0] ?? ""}${me.last_name[0] ?? ""}`.toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      <Tabs defaultValue="general">
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
          <TabsTrigger value="education" className="flex-1">Education</TabsTrigger>
          <TabsTrigger value="career" className="flex-1">Career</TabsTrigger>
        </TabsList>

        {/* GENERAL TAB */}
        <TabsContent value="general">
          {/* Profile pic */}
          <Card className="mb-4">
            <CardHeader><CardTitle className="text-sm">Profile Picture</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={picPreview ?? me.profile_pic_url ?? ""} />
                <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> Change photo
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
            </CardContent>
          </Card>

          {/* KVIS Verification */}
          <Card className="mb-4">
            <CardHeader><CardTitle className="text-sm">KVIS Verification</CardTitle></CardHeader>
            <CardContent>
              {me.is_verified ? (
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">KVIS-Verified</p>
                    <p className="text-xs text-muted-foreground">{me.kvis_email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">Not verified — confirm your @kvis.ac.th email to get the KVIS-Verified badge</p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href="/auth/verify-email">Verify</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit(saveGeneral)}>
            <Card className="mb-4">
              <CardHeader><CardTitle className="text-sm">Basic Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>First Name *</Label>
                    <Input {...register("first_name")} />
                    {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Last Name *</Label>
                    <Input {...register("last_name")} />
                    {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>KVIS Graduation Year</Label>
                  <Select defaultValue={me.kvis_year ? String(me.kvis_year) : undefined}
                    onValueChange={(v) => setValue("kvis_year", parseInt(v))}>
                    <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>
                      {KVIS_YEARS.map((y) => (
                        <SelectItem key={y.value} value={String(y.value)}>{y.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>MBTI Type</Label>
                  <Select defaultValue={me.mbti ?? undefined} onValueChange={(v) => setValue("mbti", v)}>
                    <SelectTrigger><SelectValue placeholder="Select MBTI" /></SelectTrigger>
                    <SelectContent>
                      {MBTI_TYPES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Bio</Label>
                  <Textarea placeholder="Tell your fellow alumni about yourself…" rows={3} {...register("bio")} />
                </div>
                <div className="space-y-1">
                  <Label>Interests <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
                  <Input placeholder="e.g. Machine Learning, Photography, Hiking" {...register("interests")} />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader><CardTitle className="text-sm">Location</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Current Location</Label>
                  <Input placeholder="e.g. Bangkok, Thailand" {...register("place")} />
                </div>
                <div className="space-y-1">
                  <Label>Country</Label>
                  <Select defaultValue={me.country ?? undefined} onValueChange={(v) => setValue("country", v)}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader><CardTitle className="text-sm">Social Links</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Facebook URL</Label>
                  <Input placeholder="https://facebook.com/…" {...register("facebook_url")} />
                </div>
                <div className="space-y-1">
                  <Label>LinkedIn URL</Label>
                  <Input placeholder="https://linkedin.com/in/…" {...register("linkedin_url")} />
                </div>
                <div className="space-y-1">
                  <Label>Personal Website</Label>
                  <Input placeholder="https://…" {...register("website_url")} />
                </div>
                <div className="space-y-1">
                  <Label>Line ID</Label>
                  <Input placeholder="Your Line ID" {...register("line_id")} />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </form>
        </TabsContent>

        {/* EDUCATION TAB */}
        <TabsContent value="education">
          <div className="space-y-4">
            {education.map((edu, i) => (
              <Card key={i}>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Education #{i + 1}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                      onClick={() => setEducation((prev) => prev.filter((_, j) => j !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input placeholder="University name" value={edu.uni_name}
                    onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, uni_name: e.target.value } : x))} />
                  <Select value={edu.degree}
                    onValueChange={(v) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, degree: v } : x))}>
                    <SelectTrigger><SelectValue placeholder="Degree" /></SelectTrigger>
                    <SelectContent>{DEGREES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Major" value={edu.major}
                    onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, major: e.target.value } : x))} />
                  <Select value={edu.country}
                    onValueChange={(v) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, country: v } : x))}>
                    <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                    <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Scholarship (optional)" value={edu.scholarship ?? ""}
                    onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, scholarship: e.target.value } : x))} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="Start year" value={edu.start_year ?? ""}
                      onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, start_year: parseInt(e.target.value) || undefined } : x))} />
                    <Input type="number" placeholder="End year" value={edu.end_year ?? ""}
                      onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, end_year: parseInt(e.target.value) || undefined } : x))} />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" className="w-full" onClick={() =>
              setEducation((prev) => [...prev, { uni_name: "", degree: "", major: "", country: "" }])}>
              <Plus className="h-4 w-4 mr-2" /> Add Education
            </Button>
            <Button className="w-full" onClick={saveEducation}>
              <Check className="h-4 w-4 mr-2" /> Save Education
            </Button>
          </div>
        </TabsContent>

        {/* CAREER TAB */}
        <TabsContent value="career">
          <div className="space-y-4">
            {career.map((job, i) => (
              <Card key={i}>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Position #{i + 1}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                      onClick={() => setCareer((prev) => prev.filter((_, j) => j !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input placeholder="Job title" value={job.job_title}
                    onChange={(e) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, job_title: e.target.value } : x))} />
                  <Input placeholder="Employer" value={job.employer}
                    onChange={(e) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, employer: e.target.value } : x))} />
                  <Select value={job.job_field}
                    onValueChange={(v) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, job_field: v } : x))}>
                    <SelectTrigger><SelectValue placeholder="Job field" /></SelectTrigger>
                    <SelectContent>{JOB_FIELDS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={job.country}
                    onValueChange={(v) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, country: v } : x))}>
                    <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                    <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="Start year" value={job.start_year ?? ""}
                      onChange={(e) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, start_year: parseInt(e.target.value) || undefined } : x))} />
                    <Input type="number" placeholder="End year" value={job.end_year ?? ""}
                      onChange={(e) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, end_year: parseInt(e.target.value) || undefined } : x))} />
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={job.is_current}
                      onChange={(e) => setCareer((prev) => prev.map((x, j) => j === i ? { ...x, is_current: e.target.checked } : x))} />
                    Currently working here
                  </label>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" className="w-full"
              onClick={() => setCareer((prev) => [...prev, { job_title: "", employer: "", job_field: "", country: "", is_current: false }])}>
              <Plus className="h-4 w-4 mr-2" /> Add Position
            </Button>
            <Button className="w-full" onClick={saveCareer}>
              <Check className="h-4 w-4 mr-2" /> Save Career
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
