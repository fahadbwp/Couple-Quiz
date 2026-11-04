import React from "react";

/**
 * Platform artwork component representing "Daily Path" for the games registry and homepage cards.
 */
export function DailyPathArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 390"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background soft ambient oval */}
      <ellipse
        cx="260"
        cy="195"
        rx="220"
        ry="160"
        fill="#E6F4EA"
        className="dark:fill-emerald-950/40"
      />

      {/* Grid backing plate */}
      <rect
        x="130"
        y="65"
        width="260"
        height="260"
        rx="28"
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth="4"
        className="dark:fill-slate-900 dark:stroke-slate-800"
      />

      {/* 4x4 subtle cell placeholders */}
      <rect x="145" y="80" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />
      <rect x="205" y="80" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />
      <rect x="265" y="80" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />
      <rect x="325" y="80" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />

      <rect x="145" y="140" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />
      <rect x="205" y="140" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />
      <rect x="265" y="140" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />
      <rect x="325" y="140" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />

      <rect x="145" y="200" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />
      <rect x="205" y="200" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />
      <rect x="265" y="200" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />
      <rect x="325" y="200" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />

      <rect x="145" y="260" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />
      <rect x="205" y="260" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />
      <rect x="265" y="260" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />
      <rect x="325" y="260" width="50" height="50" rx="12" fill="#F8FAFC" className="dark:fill-slate-800/60" />

      {/* Connected glowing path */}
      <path
        d="M 170 105 L 230 105 L 230 165 L 290 165 L 290 225 L 350 225 L 350 285"
        stroke="#10B981"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.25"
      />
      <path
        d="M 170 105 L 230 105 L 230 165 L 290 165 L 290 225 L 350 225 L 350 285"
        stroke="#10B981"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 170 105 L 230 105 L 230 165 L 290 165 L 290 225 L 350 225 L 350 285"
        stroke="#D1FAE5"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Start Compass Node at (170, 105) */}
      <circle cx="170" cy="105" r="18" fill="#10B981" />
      <circle cx="170" cy="105" r="14" fill="#047857" />
      <polygon points="178,105 165,100 167,105 165,110" fill="#FFFFFF" />

      {/* Goal Star / Portal Node at (350, 285) */}
      <circle cx="350" cy="285" r="18" fill="#F59E0B" />
      <circle cx="350" cy="285" r="13" fill="#D97706" />
      <path
        d="M 350 279 L 352 283.5 L 357 284 L 353 287 L 354.5 292 L 350 289 L 345.5 292 L 347 287 L 343 284 L 348 283.5 Z"
        fill="#FFFFFF"
      />

      {/* Decorative sparkling stars */}
      <g fill="#10B981" opacity="0.8">
        <path d="M 110 130 Q 110 140 100 140 Q 110 140 110 150 Q 110 140 120 140 Q 110 140 110 130 Z" />
        <path d="M 405 210 Q 405 218 397 218 Q 405 218 405 226 Q 405 218 413 218 Q 405 218 405 210 Z" />
        <path d="M 390 110 Q 390 116 384 116 Q 390 116 390 122 Q 390 116 396 116 Q 390 116 390 110 Z" />
      </g>
    </svg>
  );
}
export default DailyPathArt;
