// packages/ui/src/motion/MorphingModal.tsx
// From beui.dev/components/motion/morphing-modal styled per DESIGN.md
"use client";

import React, { type ReactNode, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE_OUT, SPRING_PANEL } from "./ease.js";
import { PresenceGate } from "./presence-gate.js";

export interface MorphingModalProps {
  viewId: string | null;
  onClose: () => void;
  children: ReactNode;
  placement?: "bottom" | "center";
  className?: string;
  style?: React.CSSProperties;
}

export function MorphingModal({
  viewId,
  onClose,
  children,
  placement = "center",
  className,
  style,
}: MorphingModalProps) {
  const open = viewId !== null;
  const reduce = useReducedMotion();
  const enterY = reduce ? 0 : placement === "bottom" ? 40 : 20;
  const enterScale = reduce ? 1 : 0.97;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <PresenceGate key="backdrop">
          {({ gate }) => (
            <motion.button
              type="button"
              aria-label="Close modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              {...gate}
              onClick={onClose}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 90,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(14px) saturate(140%)",
                WebkitBackdropFilter: "blur(14px) saturate(140%)",
                border: "none",
                cursor: "pointer",
              }}
            />
          )}
        </PresenceGate>
      ) : null}

      {open ? (
        <PresenceGate key="panel-layer">
          {({ gate }) => (
            <div
              style={{
                position: "fixed",
                inset: "16px",
                zIndex: 95,
                display: "flex",
                justifyContent: "center",
                alignItems: placement === "bottom" ? "flex-end" : "center",
                pointerEvents: "none",
              }}
            >
              <motion.div
                key="panel"
                layout
                initial={{ opacity: 0, y: enterY, scale: enterScale }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: enterY,
                  scale: reduce ? 1 : 0.98,
                  transition: { duration: 0.18, ease: EASE_OUT },
                }}
                transition={SPRING_PANEL}
                {...gate}
                style={{
                  pointerEvents: "auto",
                  position: "relative",
                  width: "100%",
                  maxWidth: "520px",
                  borderRadius: "24px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  backgroundColor: "#16181D",
                  boxShadow: "0 24px 60px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)",
                  overflow: "hidden",
                  color: "#FFFFFF",
                  fontFamily: "'Inter', sans-serif",
                  ...style,
                }}
                className={className}
              >
                <motion.div layout="position" style={{ padding: "24px" }}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={viewId}
                      initial={
                        reduce
                          ? { opacity: 0 }
                          : { opacity: 0, y: 8, filter: "blur(4px)" }
                      }
                      animate={
                        reduce
                          ? {
                              opacity: 1,
                              transition: { duration: 0.18, ease: EASE_OUT },
                            }
                          : {
                              opacity: 1,
                              y: 0,
                              filter: "blur(0px)",
                              transition: { duration: 0.24, ease: EASE_OUT },
                            }
                      }
                      exit={
                        reduce
                          ? {
                              opacity: 0,
                              transition: { duration: 0.14, ease: EASE_OUT },
                            }
                          : {
                              opacity: 0,
                              y: -8,
                              filter: "blur(4px)",
                              transition: { duration: 0.16, ease: EASE_OUT },
                            }
                      }
                    >
                      {children}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </div>
          )}
        </PresenceGate>
      ) : null}
    </AnimatePresence>
  );
}
