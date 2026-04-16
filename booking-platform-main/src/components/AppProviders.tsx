"use client";

import React from "react";
import { AuthProvider } from "../lib/auth-context";
import { ToastProvider } from "../lib/toast-context";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
