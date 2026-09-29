// apps/web/src/app/layout.tsx
import React from "react";
import "./globals.css";
import { FooterBar } from "./components/FooterBar";

export const metadata = {
  title: "Spectra | Tokenized Equities Intelligence Terminal",
  description:
    "Empirically-grounded intelligence terminal for tokenized equities on BNB Smart Chain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#0D0E12", // Deep space black (§11)
          color: "#FFFFFF",
          fontFamily: "'Inter', sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Ambient background glow */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: "1400px",
            height: "360px",
            background: "radial-gradient(ellipse at 50% 0%, rgba(240, 185, 11, 0.07) 0%, rgba(13, 14, 18, 0) 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Top Navigation Bar with Frosted Glass Effect */}
        <header
          className="glass-header sticky top-0 z-40 flex items-center justify-between px-6 h-16 border-b border-[#23272E]"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <span
                style={{
                  color: "#F0B90B",
                  fontWeight: 900,
                  fontSize: "20px",
                  letterSpacing: "1.5px",
                  textShadow: "0 0 16px rgba(240, 185, 11, 0.35)",
                }}
              >
                SPECTRA
              </span>
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 7px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(240, 185, 11, 0.15)",
                  border: "1px solid rgba(240, 185, 11, 0.3)",
                  color: "#F0B90B",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                }}
              >
                BSC
              </span>
            </a>

            <nav style={{ display: "flex", gap: "20px", fontSize: "13px", fontWeight: 500 }}>
              <a
                href="/"
                style={{
                  color: "#EAECEF",
                  textDecoration: "none",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  transition: "all 0.15s ease",
                }}
                className="hover:text-white hover:bg-white/5"
              >
                Market Intel
              </a>
              <a
                href="/flow"
                style={{
                  color: "#848E9C",
                  textDecoration: "none",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  transition: "all 0.15s ease",
                }}
                className="hover:text-white hover:bg-white/5"
              >
                Flow Radar
              </a>
              <a
                href="/forge"
                style={{
                  color: "#848E9C",
                  textDecoration: "none",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  transition: "all 0.15s ease",
                }}
                className="hover:text-white hover:bg-white/5"
              >
                Strategy Forge
              </a>
              <a
                href="/loop"
                style={{
                  color: "#F0B90B",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(240, 185, 11, 0.08)",
                  border: "1px solid rgba(240, 185, 11, 0.2)",
                  transition: "all 0.15s ease",
                }}
                className="hover:bg-yellow-500/15"
              >
                <span>Unified Loop</span>
                <span
                  style={{
                    fontSize: "9px",
                    padding: "1px 5px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(240, 185, 11, 0.25)",
                    color: "#F0B90B",
                    fontWeight: 700,
                  }}
                >
                  SEE→PROVE
                </span>
              </a>
            </nav>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "5px 12px",
                borderRadius: "9999px",
                backgroundColor: "rgba(30, 35, 41, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#0ECB81",
                  boxShadow: "0 0 8px #0ECB81",
                }}
              />
              <span style={{ color: "#EAECEF", fontWeight: 500 }}>BNB Chain 56</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, position: "relative", zIndex: 1 }}>{children}</main>

        {/* Sticky Ticker Tape Bottom Bar (§11) */}
        <FooterBar />
      </body>
    </html>
  );
}

