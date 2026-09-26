// packages/ui/src/NLInput.tsx
//
// Module 2: Natural Language Strategy Input Component
// Reference: Spectra.md §7.4, §7.6

import React, { useState } from "react";

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
        backgroundColor: "#181A20",
        border: "1px solid #2B313A",
        borderRadius: "8px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#EAECEF" }}>
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
          backgroundColor: "#14151A",
          border: "1px solid #2B313A",
          borderRadius: "6px",
          padding: "12px",
          color: "#EAECEF",
          fontSize: "14px",
          fontFamily: "'Inter', sans-serif",
          resize: "vertical",
          outline: "none",
        }}
      />

      {/* Preset Example Chips */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ fontSize: "11px", color: "#848E9C" }}>Try an example:</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {EXAMPLE_PROMPTS.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              data-testid={`example-chip-${idx}`}
              onClick={() => setPrompt(ex)}
              style={{
                fontSize: "11px",
                padding: "4px 8px",
                backgroundColor: "#20252E",
                border: "1px solid #2B313A",
                borderRadius: "4px",
                color: "#848E9C",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {idx === 0 ? "★ Basis Rotation + Flow" : idx === 1 ? "Weekly DCA" : idx === 2 ? "Oracle Guard" : "Weekend Fade"}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          data-testid="compile-btn"
          disabled={isCompiling || prompt.trim() === ""}
          onClick={() => onCompile(prompt)}
          style={{
            padding: "8px 20px",
            backgroundColor: "#F0B90B",
            color: "#0D0E12",
            border: "none",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: isCompiling || prompt.trim() === "" ? "not-allowed" : "pointer",
            opacity: isCompiling || prompt.trim() === "" ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {isCompiling ? "Compiling DSL..." : "⚡ Compile Strategy"}
        </button>
      </div>
    </div>
  );
};
