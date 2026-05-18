import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, GraduationCap, Briefcase } from "lucide-react";
import type { UserCard as UserCardType } from "@/lib/types";
import { degreeLabel, jobFieldLabel } from "@/lib/constants/options";
import { kvisYearLabel } from "@/lib/utils";

interface Props { user: UserCardType }

const MBTI_COLORS: Record<string, string> = {
  INTJ: "bg-violet-100 text-violet-700",
  INTP: "bg-violet-100 text-violet-700",
  ENTJ: "bg-violet-100 text-violet-700",
  ENTP: "bg-violet-100 text-violet-700",
  INFJ: "bg-emerald-100 text-emerald-700",
  INFP: "bg-emerald-100 text-emerald-700",
  ENFJ: "bg-emerald-100 text-emerald-700",
  ENFP: "bg-emerald-100 text-emerald-700",
  ISTJ: "bg-blue-100 text-blue-700",
  ISFJ: "bg-blue-100 text-blue-700",
  ESTJ: "bg-blue-100 text-blue-700",
  ESFJ: "bg-blue-100 text-blue-700",
  ISTP: "bg-amber-100 text-amber-700",
  ISFP: "bg-amber-100 text-amber-700",
  ESTP: "bg-amber-100 text-amber-700",
  ESFP: "bg-amber-100 text-amber-700",
};

export function UserCard({ user }: Props) {
  const initials = `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase();
  const latestEdu = user.education[user.education.length - 1];
  const currentJob = user.career.find((c) => c.is_current) ?? user.career[user.career.length - 1];

  return (
    <Link href={`/profile/${user.slug}`}>
      <Card className="group hover:shadow-md hover:border-primary/30 transition-all duration-200 h-full cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-background shadow">
              <AvatarImage src={user.profile_pic_url ?? ""} alt={user.first_name} />
              <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate group-hover:text-primary transition-colors">
                {user.first_name} {user.last_name}
              </p>
              {user.kvis_year && (
                <p className="text-xs text-muted-foreground">{kvisYearLabel(user.kvis_year)}</p>
              )}
            </div>
            {user.mbti && (
              <Badge
                variant="secondary"
                className={`shrink-0 border-transparent px-2 py-0.5 text-xs font-bold ${MBTI_COLORS[user.mbti] ?? "bg-gray-100 text-gray-600"}`}
              >
                {user.mbti}
              </Badge>
            )}
          </div>

          <div className="space-y-1.5 text-sm text-muted-foreground">
            {user.place && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user.place}</span>
              </div>
            )}
            {latestEdu && (
              <div className="flex items-center gap-1.5 truncate">
                <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{latestEdu.uni_name} · {degreeLabel(latestEdu.degree)}</span>
              </div>
            )}
            {currentJob && (
              <div className="flex items-center gap-1.5 truncate">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{currentJob.job_title} · {jobFieldLabel(currentJob.job_field)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
