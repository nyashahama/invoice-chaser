"use client";

import React from "react";

export default function Stats() {
  return (
    <div className="stats-strip">
      <div className="stat-item">
        <div className="stat-num">$2.4M</div>
        <div className="stat-label">
          Collected for
          <br />
          freelancers
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-num">94%</div>
        <div className="stat-label">
          Invoices paid
          <br />
          within 30 days
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-num">0</div>
        <div className="stat-label">
          Awkward emails
          <br />
          sent by you
        </div>
      </div>
    </div>
  );
}
