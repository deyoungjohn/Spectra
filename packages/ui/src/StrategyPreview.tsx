// packages/ui/src/StrategyPreview.tsx
//
// Module 2: Strategy DSL Preview Component
// Formatted JSON viewer with policy bounds and simulation/deployment triggers.
// Reference: Spectra.md §7.4, §7.6

import React from "react";
import { AnimatedButton } from "./motion/AnimatedButton.js";

export interface StrategyPreviewProps {
  dsl: Record<string, unknown>;
  isValid?: boolean;
  validationErrors?: string[];
  isSimulating?: boolean;
  isDeploying?: boolean;
  onSimulate?: () => void;
  onDeploy?: () => void;
}

export const StrategyPreview: React.FC<StrategyPreviewProps> = ({
  dsl,
  isValid = true,
  validationErrors = [],
  isSimulating = false,
  isDeploying = false,
  onSimulate,
  onDeploy,
}) => {
  const dslString = JSON.stringify(dsl, null, 2);

  return (
    <div
      style={{
        backgroundColor: "#181A20",
        border: "1px solid #2B313A",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        width: "100%",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#EAECEF" }}>
            📋 Compiled Strategy DSL
          </h3>
          <span
            data-testid="dsl-validity-badge"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
              backgroundColor: isValid ? "#0C382A" : "#3D1A24",
              color: isValid ? "#0ECB81" : "#F6465D",
            }}
          >
            {isValid ? "VALID DSL ✓" : "INVALID ✗"}
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {onSimulate && (
            <AnimatedButton
              data-testid="simulate-btn"
              disabled={isSimulating || !isValid}
              onClick={onSimulate}
              variant="secondary"
              size="sm"
            >
              {isSimulating ? "Simulating..." : "🔍 Run Dry-Run Simulation"}
            </AnimatedButton>
          )}

          {onDeploy && (
            <AnimatedButton
              data-testid="deploy-btn"
              disabled={isDeploying || !isValid}
              onClick={onDeploy}
              variant="gold"
              size="sm"
            >
              {isDeploying ? "Deploying..." : "🚀 Deploy to Agent Studio"}
            </AnimatedButton>
          )}
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div
          style={{
            backgroundColor: "#3D1A24",
            border: "1px solid #F6465D",
            borderRadius: "6px",
            padding: "10px 14px",
            color: "#F6465D",
            fontSize: "12px",
          }}
        >
          <strong>Validation Errors:</strong>
          <ul style={{ margin: "4px 0 0", paddingLeft: "16px" }}>
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Code viewer */}
      <pre
        data-testid="dsl-json-viewer"
        style={{
          margin: 0,
          padding: "14px",
          backgroundColor: "#14151A",
          border: "1px solid #2B313A",
          borderRadius: "6px",
          color: "#0ECB81",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "12px",
          lineHeight: 1.5,
          overflowX: "auto",
          maxHeight: "260px",
        }}
      >
        {dslString}
      </pre>
    </div>
  );
};
