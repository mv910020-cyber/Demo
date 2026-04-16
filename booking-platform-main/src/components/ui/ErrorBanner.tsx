"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

export default function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm font-semibold animate-in slide-in-from-top-2">
      <AlertCircle size={18} />
      {message}
    </div>
  );
}
