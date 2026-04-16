"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Activity, Eye, X, Building2, User, Search, Loader2 } from "lucide-react";
import { api, Demo } from "../../lib/api";
import { useToast } from "../../lib/toast-context";
import ErrorBanner from "../../components/ui/ErrorBanner";

const STAGES = ["new", "scheduled", "confirmed", "pending", "completed"];

function formatStage(stage: string): string {
  return stage.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildTimeline(status: string, createdAt: string) {
  const currentStep = Math.max(0, STAGES.indexOf(status));
  return {
    currentStep,
    timeline: STAGES.map((s, idx) => ({
      label: formatStage(s),
      date: idx <= currentStep ? new Date(createdAt).toLocaleDateString() : "-",
    })),
  };
}

export default function StatusTrackingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDemo, setSelectedDemo] = useState<Demo | null>(null);
  const [trackingData, setTrackingData] = useState<Demo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.listDemos();
        setTrackingData(data);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setError('Unable to load tracking data.');
        showToast('Failed to load tracking data', 'error');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  const filteredData = trackingData.filter((demo) =>
    demo.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demo.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedTimeline = useMemo(() => {
    if (!selectedDemo) return null;
    return buildTimeline(selectedDemo.status, selectedDemo.created_at);
  }, [selectedDemo]);

  return (
    <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Activity className="text-cyan-500" size={32} />
            Status Tracking
          </h1>
          <p className="text-slate-500 mt-2">Monitor the exact lifecycle stage of every incoming demo request.</p>
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="bg-white p-4 rounded-t-2xl border border-slate-200 border-b-0 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Company or Contact Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-b-2xl shadow-sm overflow-hidden min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <th className="p-4 pl-6">Company</th>
              <th className="p-4">Contact Name</th>
              <th className="p-4">Product Interest</th>
              <th className="p-4">Current Status</th>
              <th className="p-4 text-right pr-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400">
                  <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                  Loading statuses...
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((demo) => (
                <tr key={demo.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{demo.company_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">#{demo.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                      <User size={16} className="text-slate-400" />
                      {demo.contact_name}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-100">
                      {demo.product_interest}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-700">{formatStage(demo.status)}</td>
                  <td className="p-4 text-right pr-6">
                    <button
                      onClick={() => setSelectedDemo(demo)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 transition-all shadow-sm active:scale-95"
                    >
                      <Eye size={16} />
                      View Status
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">No tracking data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedDemo && selectedTimeline && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedDemo(null)}></div>

          <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-cyan-600 tracking-wider uppercase mb-1">#{selectedDemo.id}</p>
                <h2 className="text-2xl font-bold text-slate-900">{selectedDemo.company_name}</h2>
              </div>
              <button onClick={() => setSelectedDemo(null)} className="p-2 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-90">
                <X size={20} />
              </button>
            </div>

            <div className="p-10 overflow-x-auto">
              <div className="min-w-[700px] py-4">
                <div className="relative flex justify-between items-start w-full">
                  <div className="absolute top-[34px] left-0 w-full h-1.5 bg-slate-200 rounded-full z-0"></div>
                  <div
                    className="absolute top-[34px] left-0 h-1.5 bg-cyan-500 rounded-full z-0 transition-all duration-1000 ease-out"
                    style={{ width: `${(selectedTimeline.currentStep / Math.max(selectedTimeline.timeline.length - 1, 1)) * 100}%` }}
                  ></div>

                  {selectedTimeline.timeline.map((step, idx) => {
                    const isCompleted = idx <= selectedTimeline.currentStep;
                    const isCurrent = idx === selectedTimeline.currentStep;
                    return (
                      <div key={idx} className="relative z-10 flex flex-col items-center w-32">
                        <div className="h-6 mb-3 text-sm font-bold text-slate-800">{step.date}</div>
                        <div className={`w-5 h-5 rounded-full ring-4 ring-white transition-colors duration-500 ${isCompleted ? "bg-cyan-500 shadow-sm shadow-cyan-300" : "bg-slate-300"}`}></div>
                        <div className={`mt-4 text-sm text-center leading-tight transition-colors duration-500 ${isCurrent ? "font-bold text-cyan-700" : isCompleted ? "font-medium text-slate-700" : "font-medium text-slate-400"}`}>
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 text-right">
              <button onClick={() => setSelectedDemo(null)} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all shadow-md active:scale-95">
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
