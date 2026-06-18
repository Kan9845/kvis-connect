import type { Summary } from "@/lib/types";
import { jobFieldLabel, degreeLabel } from "@/lib/constants/options";
import { COUNTRY_MAP } from "@/lib/constants/countries";
import { Users, Globe, Briefcase, GraduationCap } from "lucide-react";

interface Props { summary: Summary }

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className="h-5 w-5 text-primary/70" />
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="text-xs text-white/60 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function TopList({ title, items }: { title: string; items: [string, number][] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.slice(0, 5).map(([key, count]) => (
          <li key={key} className="flex items-center justify-between gap-4">
            <span className="text-sm text-white/80 truncate">{key}</span>
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="h-1.5 bg-primary/60 rounded-full"
                style={{ width: `${Math.round((count / items[0][1]) * 60)}px` }}
              />
              <span className="text-xs text-white/50 w-6 text-right">{count}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SummaryFooter({ summary }: Props) {
  const countryItems = Object.entries(summary.by_country)
    .map(([code, count]) => [COUNTRY_MAP.get(code)?.label ?? code, count] as [string, number])
    .sort((a, b) => b[1] - a[1]);

  const jobItems = Object.entries(summary.by_industry_sector)
    .map(([code, count]) => [jobFieldLabel(code), count] as [string, number])
    .sort((a, b) => b[1] - a[1]);

  const degreeItems = Object.entries(summary.by_degree)
    .map(([code, count]) => [degreeLabel(code), count] as [string, number])
    .sort((a, b) => b[1] - a[1]);

  const mbtiItems = Object.entries(summary.by_mbti).sort((a, b) => b[1] - a[1]);

  const countriesCount = Object.keys(summary.by_country).length;
  const yearsCount = Object.keys(summary.by_kvis_year).length;

  return (
    <footer className="bg-slate-900 text-white mt-16">
      {/* Stats row */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard icon={Users} label="Alumni" value={summary.total} />
            <StatCard icon={Globe} label="Countries" value={countriesCount} />
            <StatCard icon={GraduationCap} label="Generations" value={yearsCount} />
            <StatCard icon={Briefcase} label="Industries" value={Object.keys(summary.by_industry_sector).length} />
          </div>
        </div>
      </div>

      {/* Breakdown lists */}
      <div className="container mx-auto px-4 py-10">
        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-8">Alumni Overview</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <TopList title="Top Countries" items={countryItems} />
          <TopList title="Top Industries" items={jobItems} />
          <TopList title="Top Degrees" items={degreeItems} />
          {mbtiItems.length > 0 && <TopList title="MBTI Types" items={mbtiItems} />}
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/30">
        © {new Date().getFullYear()} KVIS Connect
      </div>
    </footer>
  );
}
