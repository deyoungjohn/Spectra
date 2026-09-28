// packages/ui/src/NLInput.tsx
"use client";

import React, { useState } from "react";
import { AnimatedButton } from "./motion/AnimatedButton.js";

export interface NLInputProps {
  onCompile: (prompt: string) => void;
  isCompiling?: boolean;
}

const EXAMPLE_PROMPTS = [
  "Rotate my Ondo AAPL to bStocks AAPL whenever the cross-platform basis exceeds 20 bps and Flow Radar shows net accumulation above $5,000. Max trade $10, max slippage 1%.",
  "Buy $15 of TSLA on Ondo every Monday at market open with max trade $15 and max slippage 1%.",
  "Alert on telegram whenever oracle divergence on NVDA exceeds 25 bps.",
  "Sell $10 of AAPL on Ondo whenever weekend sentiment premium exceeds 120 bps.",
];

export const NLInput: React.FC<NLInputProps> = ({ onCompile, isCompiling = false }) => {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPTS[0]!);

  return (
    <div
      style={{
        backgroundColor: "#14161C",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: "22px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.3px" }}>
          💬 Natural Language Strategy Composer
        </h3>
        <span style={{ fontSize: "12px", color: "#848E9C" }}>
          Compiles to typed Strategy DSL JSON
        </span>
      </div>

      <textarea
        data-testid="nl-input-textarea"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        placeholder="Describe your strategy in plain English (e.g. 'Rotate Ondo AAPL to bStocks AAPL when basis exceeds 20 bps...')"
        style={{
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: "#0D0E12",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "12px",
          padding: "14px 16px",
          color: "#FFFFFF",
          fontSize: "14px",
          fontFamily: "'Inter', sans-serif",
          resize: "vertical",
          outline: "none",
          lineHeight: 1.5,
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#F0B90B";
          e.currentTarget.style.boxShadow = "0 0 0 2px rgba(240, 185, 11, 0.2)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />

      {/* Preset Example Chips */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span style={{ fontSize: "11px", color: "#848E9C", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Try an example:
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {EXAMPLE_PROMPTS.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              data-testid={`example-chip-${idx}`}
              onClick={() => setPrompt(ex)}
              style={{
                fontSize: "12px",
                padding: "5px 12px",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "9999px",
                color: "#B0B4BA",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                e.currentTarget.style.color = "#B0B4BA";
              }}
            >
              {idx === 0 ? "★ Basis Rotation + Flow" : idx === 1 ? "Weekly DCA" : idx === 2 ? "Oracle Guard" : "Weekend Fade"}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <AnimatedButton
          variant="gold"
          size="md"
          data-testid="compile-btn"
          disabled={isCompiling || prompt.trim() === ""}
          onClick={() => onCompile(prompt)}
          style={{
            borderRadius: "10px",
            padding: "10px 22px",
          }}
        >
          {isCompiling ? "Compiling DSL..." : "⚡ Compile Strategy"}
        </AnimatedButton>
      </div>
    </div>
  );
};
