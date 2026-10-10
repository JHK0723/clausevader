'use client';

import * as React from "react";

export default function Score({ favourability_score = 0 }) {
  const score = Math.min(100, Math.max(0, Number(favourability_score) || 0));
  
  // Circumference for r=70 is 2 * PI * 70 = ~439.8
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const scoreColor =
    score >= 70 ? "#22c55e" : score >= 45 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-xl">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
          {/* Background Track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#27272a"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Progress Ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={scoreColor}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Value */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold text-white tracking-tight">
            {score}
            <span className="text-xl text-zinc-400 font-normal">%</span>
          </span>
          <span className="text-[11px] uppercase tracking-wider text-zinc-400 mt-0.5">
            {score >= 70 ? "Favorable" : score >= 45 ? "Moderate Risk" : "High Risk"}
          </span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <h3 className="text-sm font-semibold text-zinc-200">Contract Favorability Score</h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Calculated by AI across all weighted clauses
        </p>
      </div>
    </div>
  );
}
