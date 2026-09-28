// packages/ui/src/TemplateGallery.tsx
"use client";

import React from "react";
import { TiltCard } from "./motion/TiltCard.js";

export interface TemplateCardItem {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultTicker: string;
  estimatedApyBps?: number;
}

export interface TemplateGalleryProps {
  templates: TemplateCardItem[];
  selectedTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.3px" }}>
          📦 Pre-Built Strategy Templates
        </h3>
        <span style={{ fontSize: "12px", color: "#848E9C" }}>One-click deployable templates</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "14px",
        }}
      >
        {templates.map((tpl) => {
          const isSelected = selectedTemplateId === tpl.id;
          const apyText = tpl.estimatedApyBps
            ? `~${(tpl.estimatedApyBps / 100).toFixed(1)}% APY`
            : "Risk Defense";

          return (
            <TiltCard
              key={tpl.id}
              max={6}
              data-testid={`template-card-${tpl.id}`}
              onClick={() => onSelectTemplate(tpl.id)}
              style={{
                backgroundColor: isSelected ? "#1A1D24" : "#14161C",
                border: isSelected ? "1.5px solid #F0B90B" : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                padding: "18px",
                boxShadow: isSelected
                  ? "0 8px 24px rgba(240, 185, 11, 0.15), 0 0 0 1px rgba(240, 185, 11, 0.2)"
                  : "0 4px 16px rgba(0, 0, 0, 0.25)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "14px",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(240, 185, 11, 0.12)",
                      border: "1px solid rgba(240, 185, 11, 0.25)",
                      color: "#F0B90B",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {tpl.category}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: tpl.estimatedApyBps ? "#0ECB81" : "#47C2FF",
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {apyText}
                  </span>
                </div>

                <div style={{ fontSize: "15px", fontWeight: 700, color: "#FFFFFF", marginBottom: "6px", letterSpacing: "-0.2px" }}>
                  {tpl.name}
                </div>

                <div style={{ fontSize: "12px", color: "#848E9C", lineHeight: 1.5 }}>
                  {tpl.description}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <span style={{ fontSize: "11px", color: "#848E9C" }}>Default: <strong>{tpl.defaultTicker}</strong></span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: isSelected ? "#F0B90B" : "#B0B4BA",
                  }}
                >
                  {isSelected ? "Selected ✓" : "Use Template →"}
                </span>
              </div>
            </TiltCard>
          );
        })}
      </div>
    </div>
  );
};
