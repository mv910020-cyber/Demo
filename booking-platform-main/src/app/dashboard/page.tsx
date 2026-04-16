"use client";
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, CheckCircle, Clock, XCircle, Download, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../lib/toast-context';
import ErrorBanner from '../../components/ui/ErrorBanner';

const STAT_COLOR_CLASSES: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
  orange: 'bg-orange-50 text-orange-600',
};

export default function Dashboard() {
  const [chartData, setChartData] = useState<Array<{ name: string; demos: number }>>([]);
  const [stats, setStats] = useState({
    pending: 0,
    scheduled: 0,
    completed: 0,
    noShows: 0
  });
  const [opsStats, setOpsStats] = useState({
    unassigned: 0,
    conflicts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [overview, ops] = await Promise.all([
          api.getDashboardOverview(),
          api.getOpsSummary(),
        ]);

        setStats({
          pending: overview.demos_by_status.new || 0,
          scheduled: overview.demos_by_status.scheduled || 0,
          completed: overview.demos_by_status.completed || 0,
          noShows: Math.round(overview.no_show_rate),
        });

        setOpsStats({
          unassigned: ops.unassigned_new_requests,
          conflicts: ops.upcoming_conflict_count,
        });

        setChartData(
          Object.entries(overview.demos_by_product).map(([name, demos]) => ({
            name,
            demos,
          })),
        );
        setIsLoading(false);
        
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setError('Unable to load dashboard data.');
        showToast('Failed to load dashboard', 'error');
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [showToast]);

  const handleExport = () => {
    if (chartData.length === 0) return;
    const csvHeaders = "Day,Total Demos\n";
    const csvRows = chartData.map(row => `${row.name},${row.demos}`).join("\n");
    const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Demo_Trends_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statCards = [
    { title: "Pending", value: stats.pending, icon: Clock, color: "amber" },
    { title: "Scheduled", value: stats.scheduled, icon: Users, color: "cyan" },
    { title: "Completed", value: stats.completed, icon: CheckCircle, color: "emerald" },
    { title: "No-Shows", value: stats.noShows, icon: XCircle, color: "rose" },
    { title: "Unassigned", value: opsStats.unassigned, icon: Users, color: "violet" },
    { title: "Conflicts", value: opsStats.conflicts, icon: XCircle, color: "orange" },
  ];

  return (
    <div className="p-10 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Track your demo performance and conversions.</p>
        </div>
        
        <button 
          onClick={handleExport}
          disabled={isLoading || chartData.length === 0}
          className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 hover:text-cyan-600 hover:border-cyan-200 text-sm font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          Export Report
        </button>
      </div>

      <ErrorBanner message={error} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                  
                  {/* Loading State for Numbers */}
                  {isLoading ? (
                    <div className="h-9 w-16 bg-slate-100 animate-pulse rounded mt-2"></div>
                  ) : (
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  )}
                  
                </div>
                <div className={`p-3 rounded-xl transition-transform duration-300 hover:scale-110 ${STAT_COLOR_CLASSES[stat.color]}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Product-wise Demo Volume</h2>
        <div className="h-[350px] w-full flex items-center justify-center">
          
          {/* Loading State for Chart */}
          {isLoading ? (
            <div className="flex flex-col items-center text-slate-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="text-sm font-medium">Loading chart data...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350} minWidth={0}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                <Tooltip cursor={{ stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '5 5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="demos" stroke="#06b6d4" strokeWidth={4} dot={{ r: 6, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm font-medium">No chart data available. Awaiting backend connection.</p>
          )}

        </div>
      </div>
    </div>
  );
}