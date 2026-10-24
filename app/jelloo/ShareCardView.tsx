"use client";

import { useState } from "react";
import {
  formatShareCard,
  copyShareText,
  triggerNativeShare,
  generateSpoilerFreeGrid,
  generateMultiJellyGrid,
  type JellooShareInput,
} from "@/lib/jelloo/share";

interface Props {
  input: JellooShareInput;
}

export default function ShareCardView({ input }: Props) {
  const [feedback, setFeedback] = useState<string>("");
  const card = formatShareCard(input);

  async function handleCopy() {
    const res = await copyShareText(card.fullMessage);
    if (res.success) {
      setFeedback("Copied to clipboard! 📋");
      setTimeout(() => setFeedback(""), 3500);
    } else {
      setFeedback("Failed to copy. Please try again.");
      setTimeout(() => setFeedback(""), 3500);
    }
  }

  async function handleNativeShare() {
    const res = await triggerNativeShare({
      title: card.title,
      text: card.fullMessage,
      url: card.url,
    });
    if (res.success) {
      setFeedback("Shared successfully! ✨");
      setTimeout(() => setFeedback(""), 3500);
    } else if (!res.supported) {
      // Fallback to copy if native share not supported
      await handleCopy();
    }
  }

  const isMulti = Boolean(input.jellies && input.jellies.length > 1);

  return (
    <div
      style={{
        margin: "14px 0 10px",
        padding: "12px 14px",
        background: "rgba(255, 255, 255, 0.85)",
        border: "1px dashed #c084fc",
        borderRadius: "16px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "#7c3aed",
          marginBottom: "4px",
        }}
      >
        Share Your Result
      </div>

      <pre
        style={{
          margin: "6px auto 10px",
          padding: "8px 10px",
          background: "rgba(243, 232, 255, 0.6)",
          border: "1px solid #e9d5ff",
          borderRadius: "10px",
          fontSize: "12px",
          lineHeight: "1.3",
          color: "#4c1d95",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          maxWidth: "280px",
        }}
      >
        {card.fullMessage.split("\n\n")[0]}
        {"\n"}
        {isMulti
          ? generateMultiJellyGrid(input.size, input.jellies!)
          : generateSpoilerFreeGrid(input.size, input.path)}
      </pre>

      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={handleCopy}
          style={{
            padding: "8px 12px",
            background: "#9333ea",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(147, 51, 234, 0.2)",
          }}
        >
          📋 Copy Card
        </button>

        <a
          href={card.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "8px 12px",
            background: "#25d366",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: "bold",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            boxShadow: "0 2px 4px rgba(37, 211, 102, 0.2)",
          }}
        >
          💬 WhatsApp
        </a>

        <button
          type="button"
          onClick={handleNativeShare}
          style={{
            padding: "8px 12px",
            background: "#f3e8ff",
            color: "#6b21a8",
            border: "1px solid #d8b4fe",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ↗ Share
        </button>
      </div>

      {feedback ? (
        <div
          role="status"
          style={{
            marginTop: "8px",
            fontSize: "11px",
            fontWeight: "bold",
            color:
              feedback.includes("Copied") || feedback.includes("Shared")
                ? "#16a34a"
                : "#dc2626",
          }}
        >
          {feedback}
        </div>
      ) : null}
    </div>
  );
}
