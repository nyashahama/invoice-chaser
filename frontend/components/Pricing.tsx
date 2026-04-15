"use client";

import React from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Pricing() {
  const ref = useScrollReveal<HTMLDivElement>({
    staggerSelector: ".price-card",
  });

  return (
    <section className="py-20 px-6 max-w-[1200px] mx-auto md:py-[120px] md:px-12" id="pricing">
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-green mb-4 flex items-center gap-2.5 after:content-[''] after:flex-1 after:h-px after:bg-border-default">
        Pricing
      </div>
      <h2 className="text-[clamp(32px,4vw,52px)] font-extrabold leading-[1.1] tracking-tight mb-[72px] max-w-[600px]">
        Pays for itself on the <em className="font-serif italic font-normal text-text-dim">first invoice.</em>
      </h2>
      <div ref={ref} className="grid grid-cols-1 gap-px bg-border-default border border-border-default mt-[60px] md:grid-cols-3 reveal">
        <div className="price-card bg-black py-12 px-9 relative transition-colors hover:bg-surface duration-300">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-green mb-2 block">Starter</span>
          <div className="text-[22px] font-extrabold mb-5">Solo</div>
          <div className="text-[clamp(36px,4vw,52px)] font-extrabold tracking-tighter leading-none mb-1">
            <sup className="text-[0.4em] font-normal text-text-dim align-super">$</sup>19
          </div>
          <div className="font-mono text-[11px] text-text-dim mb-8">per month</div>
          <ul className="list-none mb-9">
            <li className="font-mono text-xs text-text-dim py-2 border-b border-border-default flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">Up to 10 active invoices</li>
            <li className="font-mono text-xs text-text-dim py-2 border-b border-border-default flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">3-step reminder sequence</li>
            <li className="font-mono text-xs text-text-dim py-2 border-b border-border-default flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">Email reminders</li>
            <li className="font-mono text-xs text-text-dim py-2 border-b border-border-default flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">Manual invoice upload</li>
            <li className="font-mono text-xs text-text-dim py-2 flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">Payment detection</li>
          </ul>
          <a href="#cta" className="inline-flex items-center gap-2 text-text-dim font-mono text-xs tracking-[0.08em] uppercase no-underline hover:text-text transition-colors py-4">
            Get started →
          </a>
        </div>
        <div className={`price-card bg-surface py-12 px-9 relative transition-colors hover:bg-surface duration-300 outline outline-1 outline-green outline-offset-[-1px]`}>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-green mb-2 block">Most popular</span>
          <div className="text-[22px] font-extrabold mb-5">Pro</div>
          <div className="text-[clamp(36px,4vw,52px)] font-extrabold tracking-tighter leading-none mb-1">
            <sup className="text-[0.4em] font-normal text-text-dim align-super">$</sup>49
          </div>
          <div className="font-mono text-[11px] text-text-dim mb-8">per month</div>
          <ul className="list-none mb-9">
            <li className="font-mono text-xs text-text-dim py-2 border-b border-border-default flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">Unlimited invoices</li>
            <li className="font-mono text-xs text-text-dim py-2 border-b border-border-default flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">Custom sequences &amp; tone</li>
            <li className="font-mono text-xs text-text-dim py-2 border-b border-border-default flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">Stripe, FreshBooks, QB</li>
            <li className="font-mono text-xs text-text-dim py-2 border-b border-border-default flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">SMS + email reminders</li>
            <li className="font-mono text-xs text-text-dim py-2 border-b border-border-default flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">Smart payment detection</li>
            <li className="font-mono text-xs text-text-dim py-2 flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">Reporting dashboard</li>
          </ul>
          <a
            href="#cta"
            className="inline-flex items-center gap-2.5 bg-green text-black font-mono text-[13px] font-bold tracking-[0.05em] uppercase px-8 py-4 rounded-[2px] no-underline transition-all hover:bg-[#1fffaa] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,230,118,0.3)] border-none cursor-pointer w-full justify-center"
          >
            Start free trial →
          </a>
        </div>
        <div className="price-card bg-black py-12 px-9 relative transition-colors hover:bg-surface duration-300">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-green mb-2 block">Agency</span>
          <div className="text-[22px] font-extrabold mb-5">Team</div>
          <div className="text-[clamp(36px,4vw,52px)] font-extrabold tracking-tighter leading-none mb-1">
            <sup className="text-[0.4em] font-normal text-text-dim align-super">$</sup>99
          </div>
          <div className="font-mono text-[11px] text-text-dim mb-8">per month</div>
          <ul className="list-none mb-9">
            <li className="font-mono text-xs text-text-dim py-2 border-b border-border-default flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">Everything in Pro</li>
            <li className="font-mono text-xs text-text-dim py-2 border-b border-border-default flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">5 team seats</li>
            <li className="font-mono text-xs text-text-dim py-2 border-b border-border-default flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">Client portal branding</li>
            <li className="font-mono text-xs text-text-dim py-2 border-b border-border-default flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">API access</li>
            <li className="font-mono text-xs text-text-dim py-2 flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]">Priority support</li>
          </ul>
          <a href="#cta" className="inline-flex items-center gap-2 text-text-dim font-mono text-xs tracking-[0.08em] uppercase no-underline hover:text-text transition-colors py-4">
            Contact sales →
          </a>
        </div>
      </div>
    </section>
  );
}