"use client";

import React from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Testimonials() {
  const ref = useScrollReveal<HTMLDivElement>({
    staggerSelector: ".testimonial",
  });

  return (
    <section className="section" style={{ paddingTop: "0" }}>
      <div className="section-label">Social proof</div>
      <h2 className="section-title">
        Freelancers sleep better <em>now.</em>
      </h2>
      <div ref={ref} className="testimonials reveal">
        <div className="testimonial">
          <div className="testimonial-stars">★★★★★</div>
          <div className="testimonial-text">
            &ldquo;I had a $6k invoice that sat unpaid for 8 weeks. Three days
            after connecting InvoiceChaser, it was paid in full.&rdquo;
          </div>
          <div className="testimonial-author">
            <strong>Marcus L.</strong>
            Brand designer, freelance
          </div>
        </div>
        <div className="testimonial">
          <div className="testimonial-stars">★★★★★</div>
          <div className="testimonial-text">
            &ldquo;The awkward email thing is real. I&apos;d rather do extra
            work than follow up on late payments. This just handles it.&rdquo;
          </div>
          <div className="testimonial-author">
            <strong>Priya N.</strong>
            Copywriter &amp; content strategist
          </div>
        </div>
        <div className="testimonial">
          <div className="testimonial-stars">★★★★★</div>
          <div className="testimonial-text">
            &ldquo;Our agency recovered $40k in outstanding invoices in the
            first month. It paid for itself 80 times over.&rdquo;
          </div>
          <div className="testimonial-author">
            <strong>Tom A.</strong>
            Creative director, 3-person agency
          </div>
        </div>
      </div>
    </section>
  );
}
