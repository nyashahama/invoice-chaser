"use client";

import React from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Testimonials() {
  const ref = useScrollReveal<HTMLDivElement>({
    staggerSelector: ".testimonial",
  });

  return (
    <section className="pt-0 pb-20 px-6 max-w-[1200px] mx-auto md:pb-[120px] md:px-12">
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-green mb-4 flex items-center gap-2.5 after:content-[''] after:flex-1 after:h-px after:bg-border-default">
        Social proof
      </div>
      <h2 className="text-[clamp(32px,4vw,52px)] font-extrabold leading-[1.1] tracking-tight mb-[72px] max-w-[600px]">
        Freelancers sleep better <em className="font-serif italic font-normal text-text-dim">now.</em>
      </h2>
      <div ref={ref} className="grid grid-cols-1 gap-6 mt-[60px] md:grid-cols-3 reveal">
        <div className="testimonial border border-border-default py-8 px-8 rounded-[2px] relative transition-colors hover:border-border-light">
          <div className="text-amber text-xs mb-4 tracking-[2px]">★★★★★</div>
          <div className="font-serif italic text-[17px] leading-[1.65] text-text mb-6">
            &ldquo;I had a $6k invoice that sat unpaid for 8 weeks. Three days
            after connecting InvoiceChaser, it was paid in full.&rdquo;
          </div>
          <div className="font-mono text-[11px] text-text-dim [&>strong]:text-text [&>strong]:block [&>strong]:mb-0.5">
            <strong>Marcus L.</strong>
            Brand designer, freelance
          </div>
        </div>
        <div className="testimonial border border-border-default py-8 px-8 rounded-[2px] relative transition-colors hover:border-border-light">
          <div className="text-amber text-xs mb-4 tracking-[2px]">★★★★★</div>
          <div className="font-serif italic text-[17px] leading-[1.65] text-text mb-6">
            &ldquo;The awkward email thing is real. I&apos;d rather do extra
            work than follow up on late payments. This just handles it.&rdquo;
          </div>
          <div className="font-mono text-[11px] text-text-dim [&>strong]:text-text [&>strong]:block [&>strong]:mb-0.5">
            <strong>Priya N.</strong>
            Copywriter &amp; content strategist
          </div>
        </div>
        <div className="testimonial border border-border-default py-8 px-8 rounded-[2px] relative transition-colors hover:border-border-light">
          <div className="text-amber text-xs mb-4 tracking-[2px]">★★★★★</div>
          <div className="font-serif italic text-[17px] leading-[1.65] text-text mb-6">
            &ldquo;Our agency recovered $40k in outstanding invoices in the
            first month. It paid for itself 80 times over.&rdquo;
          </div>
          <div className="font-mono text-[11px] text-text-dim [&>strong]:text-text [&>strong]:block [&>strong]:mb-0.5">
            <strong>Tom A.</strong>
            Creative director, 3-person agency
          </div>
        </div>
      </div>
    </section>
  );
}