"use client";

import type { ReactNode } from "react";

interface DashboardShellProps {
  actions?: ReactNode;
  children: ReactNode;
  subtitle: string;
  title: string;
}

export default function DashboardShell({
  actions,
  children,
  subtitle,
  title,
}: DashboardShellProps) {
  return (
    <div className="bg-[radial-gradient(circle_at_top,rgba(0,230,118,0.08),transparent_28%),#050505] text-text min-h-screen px-5 pb-12 pt-8">
      <div className="mx-auto max-w-[1320px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2.5 font-mono text-[11px] tracking-[0.14em] uppercase text-green">
              Operations
            </div>
            <h1 className="m-0 text-[40px]">{title}</h1>
            <p className="mt-2.5 max-w-[620px] text-text-dim">
              {subtitle}
            </p>
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>

        {children}
      </div>
    </div>
  );
}