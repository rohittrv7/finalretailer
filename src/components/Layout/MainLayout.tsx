"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      {/* Sidebar - Fixed */}
      <Sidebar />

      <main className="flex-1 overflow-y-auto pl-60">
        <div className="min-h-full">{children}</div>
      </main>
    </div>
  );
}
