"use client";

import type { Summary } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, Globe, Briefcase, GraduationCap } from "lucide-react";

interface Props {
  summary: Summary | null;
}

const BLUE_PALETTE = ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"];

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-start gap-4">
      <div className="p-2.5 rounded-xl bg-blue-50">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">{title}</h2>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-2.5 text-sm">
      <p className="font-semibold text-gray-800">{label ?? payload[0].name}</p>
      <p className="text-blue-600 font-medium mt-0.5">{payload[0].value} alumni</p>
    </div>
  );
};

export function StatsClient({ summary }: Props) {
  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Could not load statistics.
      </div>
    );
  }

  // Prepare data
  const genData = Object.entries(summary.by_kvis_year)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, count]) => ({ name: `Gen ${year}`, count }));

  const countryData = Object.entries(summary.by_country)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))
    .reverse(); // highest at top for horizontal bar

  const industryData = Object.entries(summary.by_job_field)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))
    .reverse();

  const degreeData = Object.entries(summary.by_degree)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const topCountry = Object.entries(summary.by_country)[0];
  const topField = Object.entries(summary.by_job_field)[0];
  const countriesCount = Object.keys(summary.by_country).length;

  return (
    <div className="min-h-full bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900">Alumni Statistics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Aggregate data from {summary.total} registered KVIS alumni
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Hero stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Alumni"
            value={summary.total.toLocaleString()}
            sub="registered on platform"
          />
          <StatCard
            icon={Globe}
            label="Countries"
            value={countriesCount}
            sub="represented worldwide"
          />
          <StatCard
            icon={Briefcase}
            label="Top Industry"
            value={topField?.[0] ?? "—"}
            sub={topField ? `${topField[1]} alumni` : undefined}
          />
          <StatCard
            icon={GraduationCap}
            label="Top Country"
            value={topCountry?.[0] ?? "—"}
            sub={topCountry ? `${topCountry[1]} alumni` : undefined}
          />
        </div>

        {/* Alumni by Generation */}
        {genData.length > 0 && (
          <SectionCard title="Alumni by KVIS Generation">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={genData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        )}

        {/* Countries + Industries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {countryData.length > 0 && (
            <SectionCard title="Top Countries">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  layout="vertical"
                  data={countryData}
                  margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={96}
                    tick={{ fontSize: 12, fill: "#475569" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          )}

          {industryData.length > 0 && (
            <SectionCard title="Industries">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  layout="vertical"
                  data={industryData}
                  margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 12, fill: "#475569" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          )}
        </div>

        {/* Degrees */}
        {degreeData.length > 0 && (
          <SectionCard title="Degree Distribution">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="shrink-0">
                <PieChart width={220} height={220}>
                  <Pie
                    data={degreeData}
                    cx={110}
                    cy={110}
                    innerRadius={64}
                    outerRadius={96}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {degreeData.map((_, i) => (
                      <Cell key={i} fill={BLUE_PALETTE[i % BLUE_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} alumni`, name]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                </PieChart>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {degreeData.map((d, i) => {
                  const pct = ((d.value / summary.total) * 100).toFixed(1);
                  return (
                    <div key={d.name} className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: BLUE_PALETTE[i % BLUE_PALETTE.length] }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{d.name}</p>
                        <p className="text-xs text-gray-400">{d.value} alumni · {pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
