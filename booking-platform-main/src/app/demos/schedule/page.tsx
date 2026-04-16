"use client";
import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Calendar, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link'; 
import { api, Demo } from '../../../lib/api';
import { useToast } from '../../../lib/toast-context';
import ErrorBanner from '../../../components/ui/ErrorBanner';

export default function ScheduleListPage() {
  const [requests, setRequests] = useState<Demo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(true); 

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await api.listDemos();
        setRequests(data);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setError('Unable to load scheduling list.');
        showToast('Failed to load scheduling list', 'error');
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, [showToast]);

  const filteredRequests = requests.filter(req => {
    return req.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           String(req.id).toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => {
    const timeA = new Date(a.preferred_datetime || a.created_at).getTime();
    const timeB = new Date(b.preferred_datetime || b.created_at).getTime();
    return sortAsc ? timeA - timeB : timeB - timeA;
  });

  return (
    <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Demo Scheduling</h1>
          <p className="text-slate-500 mt-2">Manage incoming requests, assign teams, and dispatch calendar invites.</p>
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="bg-white p-4 rounded-t-2xl border border-slate-200 border-b-0 flex gap-4 items-center justify-between shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Company or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none text-sm transition-all"
          />
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-600 font-medium hover:bg-slate-100 transition-colors">
            <ArrowUpDown size={16} className="text-slate-400" />
            Sort: Date {sortAsc ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-b-2xl shadow-sm overflow-hidden min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <th className="p-4 pl-6">Lead / Company</th>
              <th className="p-4">Product Interest</th>
              <th className="p-4">Requested Date</th>
              <th className="p-4 text-right pr-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-400">
                  <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                  Loading requests...
                </td>
              </tr>
            ) : filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 pl-6">
                    <p className="font-bold text-slate-900">{req.company_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">#{req.id}</p>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-100">
                      {req.product_interest}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(req.preferred_datetime || req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      <span className="text-slate-300">|</span>
                      <Clock size={14} className="text-slate-400" />
                      {new Date(req.preferred_datetime || req.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <Link 
                      href={`/demos/schedule/${req.id}`}
                      className={`inline-block px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        req.status === 'new' 
                          ? 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-sm shadow-cyan-200' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {req.status === 'new' ? 'Review & Schedule' : 'View Details'}
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-500 font-medium">
                  No demo requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}