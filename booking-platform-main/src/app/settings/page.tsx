"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { User, Bell, Shield, LogOut, Save, CheckCircle2, PlugZap, Mail, MessageCircle, Video } from 'lucide-react';
import { authStorage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function SettingsPage() {
  const { logout } = useAuth();
  // Simple states for the toggles and save button
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const integrations = [
    { name: 'Google Meet', icon: Video, status: 'Connected', tone: 'emerald' },
    { name: 'Zoom', icon: Video, status: 'Connected', tone: 'emerald' },
    { name: 'Microsoft Teams', icon: Video, status: 'Connected', tone: 'emerald' },
    { name: 'Gmail / SMTP', icon: Mail, status: 'Ready', tone: 'cyan' },
    { name: 'WhatsApp', icon: MessageCircle, status: 'Ready', tone: 'cyan' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000); // Hide success message after 2s
    }, 800);
  };

  return (
    <div className="p-10 max-w-4xl mx-auto animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-2">Manage your personal profile and application preferences.</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving || saved}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
            saved 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-cyan-500 text-white hover:bg-cyan-600 active:scale-95 shadow-cyan-200'
          }`}
        >
          {isSaving ? 'Saving...' : saved ? <><CheckCircle2 size={16} /> Saved</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      <div className="space-y-6">
        
        {/* 1. Profile Information */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-6">
            <User className="text-cyan-500" size={20} />
            Profile Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input 
                type="text" 
                defaultValue="Admin User" 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-slate-700 font-medium" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input 
                type="email" 
                defaultValue="admin@gmail.com" 
                disabled
                className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed" 
              />
              <p className="text-xs text-slate-400 mt-1.5">Contact IT to change your email address.</p>
            </div>
          </div>
        </div>

        {/* 2. Notification Preferences */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-6">
            <Bell className="text-cyan-500" size={20} />
            Notifications
          </h2>
          
          <div className="space-y-4">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setEmailAlerts(!emailAlerts)}>
              <div>
                <p className="font-bold text-slate-800">New Demo Alerts</p>
                <p className="text-sm text-slate-500">Receive an email immediately when a new demo request is submitted.</p>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors relative ${emailAlerts ? 'bg-cyan-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${emailAlerts ? 'left-7' : 'left-1'}`}></div>
              </div>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setDailySummary(!dailySummary)}>
              <div>
                <p className="font-bold text-slate-800">Daily Summary</p>
                <p className="text-sm text-slate-500">Receive a daily digest of scheduled and pending demos every morning.</p>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors relative ${dailySummary ? 'bg-cyan-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${dailySummary ? 'left-7' : 'left-1'}`}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-6">
            <Shield className="text-cyan-500" size={20} />
            Security & Access
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">Password</p>
              <p className="text-sm text-slate-500">You last changed your password 3 months ago.</p>
            </div>
            <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm shadow-sm hover:bg-slate-50 hover:text-cyan-600 hover:border-cyan-200 transition-all active:scale-95">
              Change Password
            </button>
          </div>

          <div className="h-px bg-slate-100 w-full my-6"></div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <p className="font-bold text-rose-600">Log Out of Account</p>
              <p className="text-sm text-slate-500">End your current session securely.</p>
            </div>
            <Link 
              href="/" 
              onClick={() => {
                authStorage.clearToken();
                logout();
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 font-bold rounded-xl text-sm shadow-sm hover:bg-rose-100 transition-all active:scale-95"
            >
              <LogOut size={16} />
              Log Out Now
            </Link>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-6">
            <PlugZap className="text-cyan-500" size={20} />
            Integrations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <div key={integration.name} className="flex items-center justify-between border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{integration.name}</p>
                      <p className="text-xs text-slate-500">Status of backend provider integration</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${integration.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-cyan-50 text-cyan-700 border-cyan-100'}`}>
                    {integration.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}