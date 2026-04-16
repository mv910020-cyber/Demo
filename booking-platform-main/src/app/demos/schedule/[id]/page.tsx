"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Calendar,
  Video,
  Link as LinkIcon,
  CheckCircle2,
  ChevronDown,
  MessageCircle,
  Mail as MailIcon,
  Loader2,
  Send
} from "lucide-react";

import { api, ApiError, Demo, MeetingProvider, User as AppUser } from "../../../../lib/api";
import { useToast } from "../../../../lib/toast-context";
import ErrorBanner from "../../../../components/ui/ErrorBanner";

type DropdownOption = {
  label: string;
  value: string;
};

function CustomDropdown({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  return (
    <div className="relative w-full">
      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
        <Icon size={16} className="text-slate-400" /> {label}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[52px] px-4 bg-white border rounded-xl cursor-pointer flex justify-between items-center transition-all ${isOpen ? "border-cyan-500 ring-2 ring-cyan-500/20 shadow-sm" : "border-slate-200 hover:border-cyan-300"}`}
      >
        <span className={value ? "text-slate-900 font-medium text-sm" : "text-slate-400 font-medium text-sm"}>
          {value ? selectedLabel : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-cyan-500" : ""}`}
        />
      </div>
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 cursor-pointer font-medium text-sm transition-colors ${value === opt.value ? "bg-cyan-50 text-cyan-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function providerToUi(provider: MeetingProvider | null): "meet" | "zoom" | "teams" | "" {
  if (provider === "google_meet") return "meet";
  if (provider === "zoom") return "zoom";
  if (provider === "teams") return "teams";
  return "";
}

function uiToProvider(platform: string): MeetingProvider {
  if (platform === "meet") return "google_meet";
  if (platform === "zoom") return "zoom";
  return "teams";
}

export default function FinalizeDemoPage() {
  const params = useParams();
  const demoId = String(params?.id || "");

  const [demoDetails, setDemoDetails] = useState<Demo | null>(null);
  const [salesReps, setSalesReps] = useState<DropdownOption[]>([]);
  const [techLeads, setTechLeads] = useState<DropdownOption[]>([]);

  const [salesRep, setSalesRep] = useState("");
  const [techLead, setTechLead] = useState("");
  const [platform, setPlatform] = useState<"meet" | "zoom" | "teams" | "">("");
  const [finalDate, setFinalDate] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const meetingLink = useMemo(() => demoDetails?.meeting_link || "", [demoDetails]);

  useEffect(() => {
    const load = async () => {
      try {
        const [demo, users] = await Promise.all([api.getDemo(demoId), api.listUsers()]);
        setDemoDetails(demo);

        const sales: DropdownOption[] = users
          .filter((u: AppUser) => u.role === "sales")
          .map((u: AppUser) => ({ label: `${u.full_name} (${u.email})`, value: String(u.id) }));
        const technical: DropdownOption[] = users
          .filter((u: AppUser) => u.role === "technical")
          .map((u: AppUser) => ({ label: `${u.full_name} (${u.email})`, value: String(u.id) }));

        setSalesReps(sales);
        setTechLeads(technical);

        setSalesRep(demo.sales_rep_id ? String(demo.sales_rep_id) : "");
        setTechLead(demo.technical_presenter_id ? String(demo.technical_presenter_id) : "");
        
        const dateSource = demo.final_datetime || demo.preferred_datetime;
        if (dateSource) {
          // Format correctly for datetime-local input
          const localDate = new Date(dateSource);
          const offset = localDate.getTimezoneOffset() * 60000;
          const adjustedDate = new Date(localDate.getTime() - offset).toISOString().slice(0, 16);
          setFinalDate(adjustedDate);
        }
        
        setPlatform(providerToUi(demo.meeting_provider));
        setLinkGenerated(Boolean(demo.meeting_link));
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message || "Unable to load demo details.");
        } else {
          setError("Unable to load demo details.");
        }
        showToast("Failed to load demo details", "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (demoId) {
      load();
    }
  }, [demoId, showToast]);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!platform || !finalDate || !demoId) {
      setError("Please select a platform and finalized date/time before generating.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      // Convert datetime-local value to UTC ISO string
      // The finalDate is in local timezone format (e.g., "2026-04-15T14:30")
      // We need to treat it as the intended local time and convert to UTC
      const localDate = new Date(finalDate);
      const offset = localDate.getTimezoneOffset() * 60000;
      const utcDate = new Date(localDate.getTime() - offset);
      const final_datetime = utcDate.toISOString();

      const scheduled = await api.scheduleDemo(demoId, {
        sales_rep_id: salesRep ? Number(salesRep) : undefined,
        technical_presenter_id: techLead ? Number(techLead) : undefined,
        final_datetime: final_datetime,
        meeting_provider: uiToProvider(platform),
      });

      setDemoDetails(scheduled);
      setLinkGenerated(Boolean(scheduled.meeting_link));
      showToast("Meeting link generated successfully", "success");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Unable to schedule demo.");
      } else {
        setError("Unable to schedule demo.");
      }
      showToast("Unable to schedule demo", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendInvite = async (e: React.MouseEvent, channel: "email" | "whatsapp") => {
    e.preventDefault();
    if (!meetingLink || !demoId) return;

    if (channel === "email") {
      setIsSendingEmail(true);
    } else {
      setIsSendingWhatsApp(true);
    }

    try {
      const result = await api.sendInvite(demoId, channel);
      showToast(result.detail || `Invite sent via ${channel}`, "success");
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message || `Unable to send ${channel} invite`, "error");
      } else {
        showToast(`Unable to send ${channel} invite`, "error");
      }
    } finally {
      if (channel === "email") {
        setIsSendingEmail(false);
      } else {
        setIsSendingWhatsApp(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-10 max-w-5xl mx-auto flex items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading demo details...
      </div>
    );
  }

  return (
    <div className="p-10 max-w-5xl mx-auto animate-in fade-in duration-500 relative">
      <Link
        href="/demos/schedule"
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-full shadow-sm hover:bg-slate-50 hover:text-cyan-600 hover:border-cyan-200 transition-all mb-8 active:scale-95 group"
      >
        <ArrowLeft size={16} className="text-slate-400 group-hover:text-cyan-600 transition-colors" /> Back to Scheduling List
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Finalize Demo: #{demoId}</h1>
        <p className="text-slate-500 mt-2">Assign your team members, generate the meeting link, and dispatch it.</p>
      </div>

      <ErrorBanner message={error} />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lead Details</p>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{demoDetails?.company_name || "-"}</h2>
              <span className="text-slate-300">|</span>
              <span className="text-cyan-600 font-bold">{demoDetails?.product_interest || "-"}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requested Time</p>
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
              <Calendar size={16} className="text-cyan-500" />
              {demoDetails?.preferred_datetime ? new Date(demoDetails.preferred_datetime).toLocaleString() : "Not provided"}
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CustomDropdown
              label="Assign Sales Rep"
              icon={User}
              placeholder="Select Sales Rep..."
              value={salesRep}
              onChange={setSalesRep}
              options={salesReps}
            />
            <CustomDropdown
              label="Assign Technical Presenter"
              icon={ShieldCheck}
              placeholder="Select Tech Lead..."
              value={techLead}
              onChange={setTechLead}
              options={techLeads}
            />

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">Finalized Date & Time</label>
              <input
                type="datetime-local"
                value={finalDate}
                onChange={(e) => setFinalDate(e.target.value)}
                className="w-full h-[52px] px-4 bg-white border border-slate-200 rounded-xl focus:bg-slate-50 focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-slate-700 font-medium text-sm cursor-pointer hover:border-cyan-300"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Video size={16} className="text-slate-400" /> Meeting Platform
              </label>

              <div className="flex gap-3 items-end">
                <div className="flex-1 flex p-1 bg-slate-100 rounded-xl h-[52px]">
                  {[{ id: "meet", label: "Meet" }, { id: "zoom", label: "Zoom" }, { id: "teams", label: "Teams" }].map((p) => (
                    <button
                      key={p.id}
                      onClick={(e) => {
                        e.preventDefault();
                        setPlatform(p.id as "meet" | "zoom" | "teams");
                        setLinkGenerated(false); // Hide send options if platform changes
                      }}
                      className={`flex-1 flex items-center justify-center text-sm font-bold rounded-lg transition-all duration-300 ${platform === p.id ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !platform}
                  className="flex items-center justify-center gap-2 px-5 h-[52px] rounded-xl font-bold transition-all shrink-0 bg-cyan-50 text-cyan-600 border border-cyan-200 hover:bg-cyan-100 active:scale-95 disabled:opacity-60"
                >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={18} />}
                  {isGenerating ? "Generating..." : linkGenerated ? "Update Link" : "Generate"}
                </button>
              </div>
            </div>
            
            {/* Send controls appear after generating the meeting link */}
            {linkGenerated && meetingLink && (
              <div className="md:col-span-2 pt-6 mt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  
                  {/* Generated Link Display */}
                  <div className="flex-1">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      Generated Meeting Link
                    </label>
                    <a
                      href={meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 underline bg-cyan-50 px-4 py-3 rounded-xl border border-cyan-100 w-full break-all"
                    >
                      <CheckCircle2 size={16} className="shrink-0" /> {meetingLink}
                    </a>
                  </div>

                  {/* Separate direct send buttons */}
                  <div className="flex-1">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      <Send size={16} className="text-slate-400" /> Send Invite Via
                    </label>
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={(e) => handleSendInvite(e, "email")}
                        disabled={isSendingEmail || isSendingWhatsApp}
                        className="flex-1 h-[52px] rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-60 transition-all font-bold text-sm flex items-center justify-center gap-2"
                      >
                        {isSendingEmail ? <Loader2 size={16} className="animate-spin" /> : <MailIcon size={16} />} Send Email
                      </button>
                      <button
                        onClick={(e) => handleSendInvite(e, "whatsapp")}
                        disabled={isSendingEmail || isSendingWhatsApp}
                        className="flex-1 h-[52px] rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-60 transition-all font-bold text-sm flex items-center justify-center gap-2"
                      >
                        {isSendingWhatsApp ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />} Send WhatsApp
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-end items-center gap-4">
          <Link href="/demos/schedule" className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
            Cancel
          </Link>
          
        </div>
      </div>
    </div>
  );
}