"use client";

import React, { useState, useEffect } from "react";
import { Share2, Copy, Check, MessageCircle } from "lucide-react";
import {
  generateShareText,
  getWhatsAppShareUrl,
  getTwitterShareUrl,
  copyToClipboard,
  triggerNativeShare,
  CLIPBOARD_TOAST_MESSAGE,
  type ShareCardData,
} from "@/lib/daily/share";

interface DailyShareButtonsProps {
  data: ShareCardData;
}

export function DailyShareButtons({ data }: DailyShareButtonsProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  const shareText = generateShareText(data);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(shareText);
    if (success) {
      setHasCopied(true);
      showToast(CLIPBOARD_TOAST_MESSAGE);
      setTimeout(() => setHasCopied(false), 2000);
    } else {
      showToast("Unable to copy to clipboard");
    }
  };

  const handleNativeShare = async () => {
    const success = await triggerNativeShare(
      `Daily Path #${data.puzzleNumber}`,
      shareText,
      data.origin || "https://playnudge.netlify.app/daily"
    );
    if (!success) {
      // Fallback to copy if native share cancelled or unsupported
      await handleCopy();
    }
  };

  const handleWhatsApp = () => {
    const url = getWhatsAppShareUrl(shareText);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTwitter = () => {
    const url = getTwitterShareUrl(shareText);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-3 w-full">
      {/* Primary Action: Copy or Native Share */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          {hasCopied ? (
            <>
              <Check className="w-5 h-5 text-emerald-200" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              <span>Copy Scorecard</span>
            </>
          )}
        </button>

        {canNativeShare ? (
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-slate-800 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] transition cursor-pointer"
          >
            <Share2 className="w-5 h-5" />
            <span>Share...</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] transition cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span>WhatsApp</span>
          </button>
        )}
      </div>

      {/* Social intents row */}
      <div className="flex items-center justify-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-[#25D366]" />
          WhatsApp
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={handleTwitter}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-slate-100" />
          Twitter / X
        </button>
      </div>

      {/* Instant visual toast notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 py-2.5 px-5 rounded-full bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs sm:text-sm font-semibold shadow-xl border border-slate-700 dark:border-slate-300 backdrop-blur-xs animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
export default DailyShareButtons;
