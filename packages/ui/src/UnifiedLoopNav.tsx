// packages/ui/src/UnifiedLoopNav.tsx
"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { SPRING_PRESS } from "./motion/ease.js";

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
  const reduce = useReducedMotion();

  return (
    <nav
      data-testid="unified-loop-nav"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "16px 20px",
        backgroundColor: "#14161C",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
        marginBottom: "24px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {LOOP_STEPS.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.includes(step.id);
        const isClickable = !!onSelectStep;

        return (
          <React.Fragment key={step.id}>
            <motion.button
              type="button"
              data-testid={`loop-step-${step.id}`}
              whileHover={reduce || !isClickable ? undefined : { y: -1.5, transition: { duration: 0.15 } }}
              whileTap={reduce || !isClickable ? undefined : { scale: 0.98 }}
              transition={SPRING_PRESS}
              onClick={() => isClickable && onSelectStep?.(step.id)}
              disabled={!isClickable}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "12px",
                backgroundColor: isActive
                  ? "rgba(240, 185, 11, 0.12)"
                  : isCompleted
                  ? "rgba(14, 203, 129, 0.08)"
                  : "rgba(255, 255, 255, 0.03)",
                border: isActive
                  ? "1.5px solid #F0B90B"
                  : isCompleted
                  ? "1px solid rgba(14, 203, 129, 0.4)"
                  : "1px solid rgba(255, 255, 255, 0.06)",
                boxShadow: isActive ? "0 4px 16px rgba(240, 185, 11, 0.15)" : "none",
                cursor: isClickable ? "pointer" : "default",
                textAlign: "left",
                color: "#FFFFFF",
                transition: "all 0.15s ease",
                outline: "none",
              }}
            >
              {/* Step Number Circle */}
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "13px",
                  fontFamily: "'JetBrains Mono', monospace",
                  backgroundColor: isActive
                    ? "#F0B90B"
                    : isCompleted
                    ? "#0ECB81"
                    : "rgba(255, 255, 255, 0.1)",
                  color: isActive ? "#0D0E12" : "#FFFFFF",
                  boxShadow: isActive ? "0 0 10px rgba(240, 185, 11, 0.4)" : "none",
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
                      padding: "2px 6px",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      color: "#B0B4BA",
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
            </motion.button>

            {idx < LOOP_STEPS.length - 1 && (
              <div
                style={{
                  color: isCompleted ? "#0ECB81" : "rgba(255, 255, 255, 0.2)",
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
