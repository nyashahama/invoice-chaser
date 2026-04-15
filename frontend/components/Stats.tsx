"use client";

import { useCallback, useRef, useState } from "react";

function animateValue(
  el: HTMLDivElement,
  end: number,
  duration: number,
  decimals: number,
  setter: (v: number) => void,
) {
  const startTime = performance.now();

  const animate = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    setter(eased * end);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

export default function Stats() {
  const [revenue, setRevenue] = useState(0);
  const [paid, setPaid] = useState(0);
  const animatedRef = useRef(false);

  const observeRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el || animatedRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting || animatedRef.current) return;
          animatedRef.current = true;
          const revenueEl = el.parentElement?.querySelector("[data-revenue]");
          const paidEl = el.parentElement?.querySelector("[data-paid]");
          if (revenueEl instanceof HTMLDivElement) {
            animateValue(revenueEl, 2.4, 2000, 1, setRevenue);
          }
          if (paidEl instanceof HTMLDivElement) {
            animateValue(paidEl, 94, 2000, 0, setPaid);
          }
        },
        { threshold: 0.3 },
      );

      observer.observe(el);
    },
    [],
  );

  const revenueFormatted = revenue === 0 ? "0" : revenue.toFixed(1);
  const paidFormatted = paid === 0 ? "0" : Math.round(paid).toLocaleString();

  return (
    <>
      <div className="divider-gradient" />
      <div className="relative overflow-hidden bg-surface px-6 grid grid-cols-1 md:grid-cols-3 md:px-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[radial-gradient(ellipse,rgba(0,230,118,0.04)_0%,transparent_70%)] pointer-events-none max-md:hidden" />
        <div ref={observeRef} data-revenue className="py-10 border-b border-border-default opacity-0 animate-fade-up md:border-b-0 md:border-r md:px-12">
          <div className="text-[clamp(36px,4vw,54px)] font-extrabold leading-none mb-2 text-green tracking-tight">${revenueFormatted}M</div>
          <div className="font-mono text-[11px] text-text-dim tracking-[0.1em] uppercase leading-[1.5]">
            Collected for
            <br />
            freelancers
          </div>
        </div>
        <div data-paid className="py-10 border-b border-border-default opacity-0 animate-fade-up md:border-b-0 md:border-r md:px-12">
          <div className="text-[clamp(36px,4vw,54px)] font-extrabold leading-none mb-2 text-green tracking-tight">{paidFormatted}%</div>
          <div className="font-mono text-[11px] text-text-dim tracking-[0.1em] uppercase leading-[1.5]">
            Invoices paid
            <br />
            within 30 days
          </div>
        </div>
        <div className="py-10 border-b border-border-default opacity-0 animate-fade-up md:border-b-0 md:border-r md:px-12">
          <div className="text-[clamp(36px,4vw,54px)] font-extrabold leading-none mb-2 text-green tracking-tight">0</div>
          <div className="font-mono text-[11px] text-text-dim tracking-[0.1em] uppercase leading-[1.5]">
            Awkward emails
            <br />
            sent by you
          </div>
        </div>
      </div>
      <div className="divider-gradient" />
    </>
  );
}