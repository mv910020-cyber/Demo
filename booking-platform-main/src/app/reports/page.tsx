"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Download, Calendar, TrendingUp, Trophy, Loader2, BarChart2, Table as TableIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { api, Demo, DemoStatus, User } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { useToast } from "../../lib/toast-context";
import ErrorBanner from "../../components/ui/ErrorBanner";

type PerfRow = {
  id: number;
  name: string;
  role: string;
  assigned: number;
  completed: number;
  winRate: string;
};

const COLORS = ["#06b6d4", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
const ASSIGNED_BAR_COLOR = "#cbd5e1";
const COMPLETED_BAR_COLOR = "#06b6d4";
const COMPLETED_STATUSES: DemoStatus[] = ["completed"];

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();

  const [timeframe, setTimeframe] = useState("1 Month");
  const [viewMode, setViewMode] = useState<"table" | "charts">("charts");

  const [teamPerformance, setTeamPerformance] = useState<PerfRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [users, demos] = await Promise.all([api.listUsers(), api.listDemos()]);
        const rows = buildPerformance(users, demos, timeframe);
        setTeamPerformance(rows);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Unable to load reports data.");
        showToast("Failed to load reports", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, [timeframe, showToast]);

  const chartRows = useMemo(() => teamPerformance.filter((row) => row.assigned > 0).slice(0, 5), [teamPerformance]);

  if (!loading && user && user.role !== "admin" && user.role !== "management" && user.role !== "sales" && user.role !== "technical") {
    return (
      <div className="p-10 max-w-4xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl p-6 font-semibold">
          You do not have permission to view reports.
        </div>
      </div>
    );
  }

  const handleExport = () => {
    if (teamPerformance.length === 0) return;
    const csvHeaders = "Team Member,Role,Demos Assigned,Completed,Win Rate\n";
    const csvRows = teamPerformance
      .map((m) => `${m.name},${m.role},${m.assigned},${m.completed},${m.winRate}`)
      .join("\n");
    const blob = new Blob([csvHeaders + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Performance_Report_${timeframe.replace(" ", "_").toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const activeRows = viewMode === "charts" ? chartRows : teamPerformance;

  return (
    <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Performance Reports</h1>
          <p className="text-slate-500 mt-2">Deep dive into team metrics and historical conversion data.</p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 shadow-sm">
            <Calendar size={16} className="text-slate-400 mr-2" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-transparent outline-none cursor-pointer font-bold text-slate-700"
            >
              <option value="1 Week">1 Week</option>
              <option value="1 Month">1 Month</option>
              <option value="3 Months">3 Months</option>
              <option value="1 Year">1 Year</option>
              <option value="Max">Max (All Time)</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            disabled={isLoading || teamPerformance.length === 0}
            className="flex items-center gap-2 bg-cyan-500 text-white px-5 py-2 rounded-lg shadow-sm shadow-cyan-200 hover:bg-cyan-600 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="text-cyan-600" size={20} />
            <h2 className="font-bold text-slate-800 text-lg">Sales Team Leaderboard</h2>
          </div>

          <div className="flex bg-slate-200/50 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === "table" ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <TableIcon size={16} /> Table
            </button>
            <button
              onClick={() => setViewMode("charts")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === "charts" ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <BarChart2 size={16} /> Visual Charts
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="font-medium">Loading report data...</p>
          </div>
        ) : activeRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-500">
            <p className="font-medium text-lg">No data found for {timeframe}</p>
          </div>
        ) : viewMode === "table" ? (
          <table className="w-full text-left border-collapse animate-in fade-in">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold bg-white">
                <th className="p-4 pl-6">Team Member</th>
                <th className="p-4">Demos Assigned</th>
                <th className="p-4">Completed</th>
                <th className="p-4">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamPerformance.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 pl-6">
                    <p className="font-bold text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{member.role}</p>
                  </td>
                  <td className="p-4 font-medium text-slate-600">{member.assigned}</td>
                  <td className="p-4 font-medium text-slate-600">{member.completed}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <TrendingUp size={12} /> {member.winRate}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in bg-white">
            <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-100 p-4">
              <h3 className="text-sm font-bold text-slate-500 mb-6 text-center uppercase tracking-wider">Completed vs Assigned</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300} minWidth={0}>
                  <BarChart data={chartRows} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                      <linearGradient id="assignedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e2e8f0" />
                        <stop offset="100%" stopColor="#94a3b8" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbeafe" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 12 }} />
                    <Tooltip cursor={{ fill: "#ecfeff" }} contentStyle={{ borderRadius: "12px", border: "1px solid #bae6fd", boxShadow: "0 10px 20px -10px rgb(14 116 144 / 0.5)" }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar dataKey="assigned" name="Assigned" fill="url(#assignedGradient)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="url(#completedGradient)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-emerald-100 p-4">
              <h3 className="text-sm font-bold text-slate-500 mb-6 text-center uppercase tracking-wider">Demo Completion Share</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={chartRows}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      stroke="#ffffff"
                      strokeWidth={2}
                      dataKey="completed"
                      nameKey="name"
                    >
                      {chartRows.map((entry, index) => (
                        <Cell key={`cell-${entry.id}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #bbf7d0", boxShadow: "0 10px 20px -10px rgb(22 163 74 / 0.4)" }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function buildPerformance(users: User[], demos: Demo[], timeframe: string): PerfRow[] {
  const now = Date.now();
  const cutoff = getCutoff(now, timeframe);
  const scoped = demos.filter((d) => {
    const sourceTime = d.final_datetime || d.preferred_datetime || d.created_at;
    if (!sourceTime) return false;
    const demoTime = new Date(sourceTime).getTime();
    return cutoff ? demoTime >= cutoff : true;
  });

  const rows = users
    .filter((u) => u.role === "sales" || u.role === "technical")
    .map((u) => {
      const assignedItems = scoped.filter((d) => d.sales_rep_id === u.id || d.technical_presenter_id === u.id);
      const assigned = assignedItems.length;
      const completed = assignedItems.filter((d) => COMPLETED_STATUSES.includes(d.status)).length;
      const winRate = assigned > 0 ? `${((completed / assigned) * 100).toFixed(1)}%` : "0.0%";

      return {
        id: u.id,
        name: u.full_name,
        role: u.role,
        assigned,
        completed,
        winRate,
      };
    })
    .sort((a, b) => {
      if (b.completed !== a.completed) return b.completed - a.completed;
      if (b.assigned !== a.assigned) return b.assigned - a.assigned;
      return parseFloat(b.winRate) - parseFloat(a.winRate);
    });

  return rows;
}

function getCutoff(now: number, timeframe: string): number | null {
  if (timeframe === "1 Week") return now - 7 * 24 * 60 * 60 * 1000;
  if (timeframe === "1 Month") return now - 30 * 24 * 60 * 60 * 1000;
  if (timeframe === "3 Months") return now - 90 * 24 * 60 * 60 * 1000;
  if (timeframe === "1 Year") return now - 365 * 24 * 60 * 60 * 1000;
  return null;
}
