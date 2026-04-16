"use client";

import React, { useMemo } from "react";
import { CalendarClock, Copy, Database, FileCode2, KeyRound, Plug, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { authStorage } from "../../lib/api";
import { useToast } from "../../lib/toast-context";

const schemaSections = [
  {
    title: "users",
    icon: KeyRound,
    rows: [
      "id",
      "full_name",
      "email",
      "password_hash",
      "role: admin | sales | technical | management",
      "created_at",
    ],
  },
  {
    title: "availabilities",
    icon: CalendarClock,
    rows: ["id", "user_id", "day_of_week (0-6)", "start_time", "end_time", "is_available"],
  },
  {
    title: "demos",
    icon: Database,
    rows: [
      "product_interest",
      "company_name",
      "contact_name",
      "contact_email",
      "contact_phone",
      "preferred_datetime",
      "final_datetime",
      "demo_type: online | offline",
      "status: new | scheduled | confirmed | completed",
      "sales_rep_id",
      "technical_presenter_id",
      "meeting_provider: google_meet | zoom | teams",
      "meeting_link",
      "recording_url",
      "recording_notes",
      "recording_uploaded_at",
    ],
  },
  {
    title: "demo_reminders",
    icon: ShieldCheck,
    rows: [
      "demo_id",
      "channel: email | whatsapp",
      "remind_at",
      "attempt_count",
      "max_attempts",
      "status: pending | sent | failed",
      "failure_reason",
      "sent_at",
    ],
  },
];

const apiGroups = [
  {
    title: "Auth",
    icon: FileCode2,
    endpoints: ["POST /auth/login", "POST /auth/register"],
  },
  {
    title: "Users",
    icon: KeyRound,
    endpoints: ["GET /users/me", "GET /users/", "GET /users/{user_id}"],
  },
  {
    title: "Demos",
    icon: Database,
    endpoints: [
      "GET /demos/",
      "POST /demos/",
      "GET /demos/{demo_id}",
      "POST /demos/{demo_id}/schedule",
      "POST /demos/{demo_id}/status",
      "POST /demos/{demo_id}/post-notes",
      "PATCH /demos/{demo_id}/recording",
      "GET /demos/{demo_id}/reminders/",
      "POST /demos/{demo_id}/reminders/",
    ],
  },
  {
    title: "Dashboard",
    icon: Plug,
    endpoints: [
      "GET /dashboard/overview",
      "GET /dashboard/ops-summary",
      "GET /dashboard/dead-letter-reminders",
    ],
  },
];

const payloadSnippets = [
  {
    title: "Login payload",
    endpoint: "POST /auth/login",
    body: {
      email: "admin@gmail.com",
      password: "password",
    },
  },
  {
    title: "Create demo",
    endpoint: "POST /demos/",
    body: {
      product_interest: "FastTrade99",
      company_name: "Acme Corp",
      contact_name: "John Doe",
      contact_email: "john@acme.com",
      contact_phone: "+1 555 000 0000",
      preferred_datetime: "2026-04-15T10:00:00Z",
      demo_type: "online",
      use_case_notes: "Need trading automation overview",
    },
  },
  {
    title: "Schedule demo",
    endpoint: "POST /demos/{demo_id}/schedule",
    body: {
      sales_rep_id: 12,
      technical_presenter_id: 7,
      final_datetime: "2026-04-16T10:00:00Z",
      meeting_provider: "google_meet",
    },
  },
  {
    title: "Update recording",
    endpoint: "PATCH /demos/{demo_id}/recording",
    body: {
      recording_url: "https://storage.example/demo.mp4",
      recording_notes: "Client requested follow-up email",
    },
  },
];

export default function ContractsPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const token = authStorage.getToken();

  const authState = useMemo(() => {
    if (loading) return "Loading auth context...";
    if (!token) return "No token present";
    return user ? `Authenticated as ${user.full_name} (${user.role})` : "Token present, user pending";
  }, [loading, token, user]);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast("Copied to clipboard", "success");
    } catch (error) {
      console.error("Copy failed:", error);
      showToast("Failed to copy to clipboard", "error");
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Database Schema & API Contracts</h1>
          <p className="text-slate-500 mt-2 max-w-3xl">
            A living frontend reference for backend models, endpoint names, request payloads, and live auth state used by the booking platform.
          </p>
        </div>
        <div className="px-4 py-2 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 text-sm font-bold">
          Backend-aligned contract view
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <UserRound className="text-cyan-600" size={20} />
            <h2 className="font-bold text-slate-800 text-lg">Live Auth Status</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-700 font-medium">
              {authState}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-slate-200 p-4 bg-white">
                <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">Token</p>
                <p className="text-slate-800 font-mono break-all text-xs">{token || "No token stored"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 bg-white">
                <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">Current User</p>
                <p className="text-slate-800 font-medium">{user ? `${user.full_name} • ${user.email}` : "Awaiting backend session"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleCopy(token || "")}
                disabled={!token}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy size={16} /> Copy Token
              </button>
              <button
                onClick={() => handleCopy(JSON.stringify(user ?? {}, null, 2))}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 text-sm font-bold"
              >
                <Copy size={16} /> Copy User JSON
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <ShieldCheck className="text-cyan-600" size={20} />
            <h2 className="font-bold text-slate-800 text-lg">Auth Contracts</h2>
          </div>
          <div className="p-5 space-y-3 text-sm text-slate-700">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="font-bold text-slate-900 mb-1">Session Rules</p>
              <p>Middleware protects non-auth pages and redirects unauthenticated users to /login.</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="font-bold text-slate-900 mb-1">Role Routing</p>
              <p>Sidebar items and reports/contracts pages are filtered by backend roles.</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="font-bold text-slate-900 mb-1">Token Storage</p>
              <p>Token is stored in localStorage and cookie for client fetches + middleware guards.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {schemaSections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                <Icon className="text-cyan-600" size={20} />
                <h2 className="font-bold text-slate-800 text-lg capitalize">{section.title}</h2>
              </div>
              <div className="p-5 space-y-2">
                {section.rows.map((row) => (
                  <div key={row} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-700 font-medium">
                    {row}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {apiGroups.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.title} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                <Icon className="text-cyan-600" size={20} />
                <h2 className="font-bold text-slate-800 text-lg">{group.title} endpoints</h2>
              </div>
              <div className="p-5 space-y-3">
                {group.endpoints.map((endpoint) => (
                  <button
                    key={endpoint}
                    onClick={() => handleCopy(endpoint)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-slate-900 text-slate-100 text-sm font-mono font-medium overflow-x-auto flex items-center justify-between gap-3 hover:bg-slate-800 transition-colors"
                  >
                    <span>{endpoint}</span>
                    <Copy size={14} className="shrink-0 text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <FileCode2 className="text-cyan-600" size={20} />
          <h2 className="font-bold text-slate-800 text-lg">Copyable Payload Examples</h2>
        </div>
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {payloadSnippets.map((snippet) => (
            <div key={snippet.title} className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{snippet.title}</p>
                  <p className="text-xs text-slate-500">{snippet.endpoint}</p>
                </div>
                <button
                  onClick={() => handleCopy(JSON.stringify(snippet.body, null, 2))}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold"
                >
                  <Copy size={14} /> Copy JSON
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 text-xs overflow-x-auto font-mono leading-6">
{JSON.stringify(snippet.body, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
