"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  JELLOO_ADSTERRA_300X250,
  JELLOO_BANNER_ENABLED,
  mayShowJellooBanner,
  type AdPlacement,
} from "@/lib/platform/ads";

export interface JellooAdsterraBannerProps {
  placement?: AdPlacement;
  className?: string;
  consent?: boolean;
  familyApproved?: boolean;
  internal?: boolean;
  phase?: "idle" | "active" | "pin" | "submitting" | "result";
  reserveSpaceWhenDisabled?: boolean;
}

/**
 * Dedicated, reusable Adsterra 300x250 Banner for Jelloo.
 *
 * SAFETY INVARIANTS:
 * 1. Disabled by default via the JELLOO_BANNER_ENABLED gate.
 * 2. Never executes third-party scripts during SSR, local dev, internal QA, or unit tests.
 * 3. Exact 300x250 reserved slot prevents Cumulative Layout Shift (CLS).
 * 4. Isolated iframe sandbox prevents window.atOptions conflicts and DOM pollution.
 * 5. Distinctly labeled as "Advertisement" to prevent deceptive clicks.
 * 6. Kept separate from game boards, rotation tiles, and navigation buttons.
 */
export default function JellooAdsterraBanner({
  placement = "jelloo-after-result",
  className = "",
  consent = false,
  familyApproved = false,
  internal = false,
  phase = "result",
  reserveSpaceWhenDisabled = false,
}: JellooAdsterraBannerProps) {
  const [mounted, setMounted] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  const shouldShow = JELLOO_BANNER_ENABLED && process.env.NODE_ENV === "production" && mayShowJellooBanner({
    consent,
    familyApproved,
    internal,
    phase,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !shouldShow) return;

    const container = iframeContainerRef.current;
    if (!container) return;

    // Prevent duplicate iframe creation
    if (container.querySelector("iframe")) return;

    try {
      const iframe = document.createElement("iframe");
      iframe.width = String(JELLOO_ADSTERRA_300X250.width);
      iframe.height = String(JELLOO_ADSTERRA_300X250.height);
      iframe.style.border = "none";
      iframe.style.overflow = "hidden";
      iframe.style.width = `${JELLOO_ADSTERRA_300X250.width}px`;
      iframe.style.height = `${JELLOO_ADSTERRA_300X250.height}px`;
      iframe.title = "Advertisement";
      iframe.loading = "lazy";
      // Opaque origin: third-party code cannot access parent DOM or escape the sandbox.
      // Popups/top navigation stay blocked until separately reviewed provider testing.
      iframe.sandbox.add("allow-scripts");

      // Build isolated iframe srcdoc with exact owner-provided Adsterra parameters
      const srcDocContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <base target="_blank">
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      background: transparent;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${JELLOO_ADSTERRA_300X250.key}',
      'format' : '${JELLOO_ADSTERRA_300X250.format}',
      'height' : ${JELLOO_ADSTERRA_300X250.height},
      'width' : ${JELLOO_ADSTERRA_300X250.width},
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="${JELLOO_ADSTERRA_300X250.src}"></script>
</body>
</html>`;

      iframe.srcdoc = srcDocContent;
      container.appendChild(iframe);
    } catch {
      // Graceful fallback if ad-blocker or iframe restriction prevents insertion
    }

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [mounted, shouldShow]);

  // When disabled by release gate:
  if (!shouldShow) {
    if (!reserveSpaceWhenDisabled) {
      return null;
    }
    return (
      <aside
        aria-label="Advertisement slot (inactive)"
        data-testid="jelloo-ad-slot-inactive"
        data-placement={placement}
        className={`w-full max-w-[320px] mx-auto my-3 flex flex-col items-center justify-center ${className}`}
      >
        <div className="w-[300px] h-[250px] border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 select-none">
          Advertisement (Disabled)
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Advertisement"
      data-testid="jelloo-ad-slot-active"
      data-placement={placement}
      className={`w-full max-w-[320px] mx-auto my-8 flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-full flex justify-between items-center px-2 mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase select-none">
        <span>Sponsored</span>
        <span>Adsterra 300×250</span>
      </div>
      <div
        className="w-[300px] h-[250px] relative bg-slate-50/50 flex items-center justify-center overflow-hidden shadow-xs"
        style={{ minWidth: 300, minHeight: 250 }}
      >
        <div
          ref={iframeContainerRef}
          className="w-[300px] h-[250px] flex items-center justify-center"
        />
      </div>
    </aside>
  );
}
