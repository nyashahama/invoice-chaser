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
    <div
      style={{
        background:
          "radial-gradient(circle at top, rgba(0,230,118,0.08), transparent 28%), #050505",
        color: "var(--text)",
        minHeight: "100vh",
        padding: "32px 20px 48px",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: "1320px" }}>
        <div
          style={{
            alignItems: "flex-end",
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div>
            <div
              style={{
                color: "var(--green)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.14em",
                marginBottom: "10px",
                textTransform: "uppercase",
              }}
            >
              Operations
            </div>
            <h1 style={{ fontSize: "40px", margin: 0 }}>{title}</h1>
            <p
              style={{
                color: "var(--text-dim)",
                margin: "10px 0 0",
                maxWidth: "620px",
              }}
            >
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
