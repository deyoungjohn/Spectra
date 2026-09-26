// packages/ui/src/UnifiedLoopNav.tsx
import React from "react";

export type LoopStepId = 1 | 2 | 3 | 4;

export interface LoopStepMeta {
  id: LoopStepId;
  label: "SEE" | "READ" | "FORGE" | "PROVE";
  name: string;
  tagline: string;
  badge: string;
}

export const LOOP_STEPS: LoopStepMeta[] = [
  {
    id: 1,
    label: "SEE",
    name: "Market Intelligence",
    tagline: "Spot price & oracle anomalies",
    badge: "Module 1",
  },
  {
    id: 2,
    label: "READ",
    name: "Flow Radar",
    tagline: "Track whale & smart-money flows",
    badge: "Module 3",
  },
  {
    id: 3,
    label: "FORGE",
    name: "Strategy Forge",
    tagline: "Synthesize & dry-run agent rule",
    badge: "Module 2",
  },
  {
    id: 4,
    label: "PROVE",
    name: "Receipt Vault",
    tagline: "Cryptographic on-chain proof",
    badge: "Base Layer",
  },
];

export interface UnifiedLoopNavProps {
  currentStep: LoopStepId;
  onSelectStep?: (step: LoopStepId) => void;
  completedSteps?: LoopStepId[];
}

export const UnifiedLoopNav: React.FC<UnifiedLoopNavProps> = ({
  currentStep,
  onSelectStep,
  completedSteps = [],
}) => {
  return (
    <nav
      data-testid="unified-loop-nav"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "16px 20px",
        backgroundColor: "#16181D",
        borderRadius: "8px",
        border: "1px solid #23272E",
        marginBottom: "24px",
      }}
    >
      {LOOP_STEPS.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.includes(step.id);
        const isClickable = !!onSelectStep;

        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              data-testid={`loop-step-${step.id}`}
              onClick={() => isClickable && onSelectStep?.(step.id)}
              disabled={!isClickable}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "6px",
                backgroundColor: isActive
                  ? "rgba(240, 185, 11, 0.1)"
                  : isCompleted
                  ? "rgba(14, 203, 129, 0.08)"
                  : "#1E2329",
                border: isActive
                  ? "1px solid #F0B90B"
                  : isCompleted
                  ? "1px solid #0ECB81"
                  : "1px solid #2B313A",
                cursor: isClickable ? "pointer" : "default",
                textAlign: "left",
                color: "#FFFFFF",
                transition: "all 0.15s ease",
              }}
            >
              {/* Step Number Circle */}
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "12px",
                  fontFamily: "'JetBrains Mono', monospace",
                  backgroundColor: isActive
                    ? "#F0B90B"
                    : isCompleted
                    ? "#0ECB81"
                    : "#2B313A",
                  color: isActive ? "#0D0E12" : "#FFFFFF",
                  flexShrink: 0,
                }}
              >
                {isCompleted ? "✓" : step.id}
              </div>

              {/* Text Info */}
              <div style={{ overflow: "hidden" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "2px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      letterSpacing: "0.5px",
                      color: isActive
                        ? "#F0B90B"
                        : isCompleted
                        ? "#0ECB81"
                        : "#EAECEF",
                    }}
                  >
                    {step.label}
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      backgroundColor: "#2B313A",
                      color: "#848E9C",
                      fontWeight: 600,
                    }}
                  >
                    {step.badge}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#848E9C",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {step.tagline}
                </div>
              </div>
            </button>

            {idx < LOOP_STEPS.length - 1 && (
              <div
                style={{
                  color: isCompleted ? "#0ECB81" : "#474D57",
                  fontSize: "14px",
                  fontWeight: 800,
                  userSelect: "none",
                }}
              >
                →
              </div>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
