// packages/ui/src/TemplateGallery.tsx
//
// Module 2: Strategy Forge Template Gallery Component
// Reference: Spectra.md §7.6, §7.7

import React from "react";

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
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#EAECEF" }}>
          📦 Pre-Built Strategy Templates
        </h3>
        <span style={{ fontSize: "12px", color: "#848E9C" }}>One-click deployable templates</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "14px",
        }}
      >
        {templates.map((tpl) => {
          const isSelected = selectedTemplateId === tpl.id;
          const apyText = tpl.estimatedApyBps
            ? `~${(tpl.estimatedApyBps / 100).toFixed(1)}% APY`
            : "Risk Defense";

          return (
            <div
              key={tpl.id}
              data-testid={`template-card-${tpl.id}`}
              onClick={() => onSelectTemplate(tpl.id)}
              style={{
                backgroundColor: isSelected ? "#20252E" : "#181A20",
                border: isSelected ? "1px solid #F0B90B" : "1px solid #2B313A",
                borderRadius: "8px",
                padding: "16px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
                transition: "border-color 0.15s",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "3px",
                      backgroundColor: "#2B313A",
                      color: "#F0B90B",
                    }}
                  >
                    {tpl.category}
                  </span>
                  <span style={{ fontSize: "11px", color: "#0ECB81", fontWeight: 600 }}>
                    {apyText}
                  </span>
                </div>

                <div style={{ fontSize: "14px", fontWeight: 700, color: "#EAECEF", marginBottom: "6px" }}>
                  {tpl.name}
                </div>

                <div style={{ fontSize: "12px", color: "#848E9C", lineHeight: 1.4 }}>
                  {tpl.description}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid #262B34" }}>
                <span style={{ fontSize: "11px", color: "#848E9C" }}>Default: {tpl.defaultTicker}</span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: isSelected ? "#F0B90B" : "#848E9C",
                  }}
                >
                  {isSelected ? "Selected ✓" : "Use Template →"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
