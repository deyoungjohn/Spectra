// packages/ui/src/motion/ColorSelector.tsx
// From beui.dev/components/motion/color-selector & DESIGN.md
"use client";

import React, { createContext, useId, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { SPRING_LAYOUT, SPRING_PRESS } from "./ease.js";

type ColorSelectorContextValue = {
  value: string;
  select: (value: string) => void;
  name: string;
};

const ColorSelectorContext = createContext<ColorSelectorContextValue | null>(null);

export interface ColorOption {
  value: string;
  color: string;
  label: string;
}

export interface ColorSelectorProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: ColorOption[];
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ColorSelector({
  value,
  defaultValue = "",
  onValueChange,
  options,
  label,
  className,
  style,
}: ColorSelectorProps) {
  const id = useId();
  const [internal, setInternal] = useState(defaultValue || (options[0]?.value ?? ""));
  const current = value ?? internal;
  const reduce = useReducedMotion();

  const select = (next: string) => {
    if (next === current) return;
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };

  return (
    <ColorSelectorContext.Provider value={{ value: current, select, name: id }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", ...style }} className={className}>
        {label && (
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#848E9C", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {label}
          </span>
        )}
        <LayoutGroup id={id}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {options.map((opt) => {
              const selected = current === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  whileTap={reduce ? undefined : { scale: 0.94 }}
                  transition={SPRING_PRESS}
                  onClick={() => select(opt.value)}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    backgroundColor: selected ? "rgba(255, 255, 255, 0.08)" : "transparent",
                    border: "1px solid",
                    borderColor: selected ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.06)",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {selected && (
                    <motion.span
                      layoutId={reduce ? undefined : "color-selection"}
                      transition={SPRING_LAYOUT}
                      style={{
                        position: "absolute",
                        inset: "-2px",
                        borderRadius: "9999px",
                        border: `2px solid ${opt.color}`,
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: opt.color,
                      boxShadow: selected ? `0 0 8px ${opt.color}` : "none",
                    }}
                  />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: selected ? "#FFFFFF" : "#848E9C" }}>
                    {opt.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </ColorSelectorContext.Provider>
  );
}
