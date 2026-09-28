// apps/web/src/app/layout.tsx
import React from "react";
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
          backgroundColor: "#0D0E12",
          backgroundImage: "radial-gradient(ellipse 80% 35% at 50% -10%, rgba(240, 185, 11, 0.08), transparent 70%)",
          backgroundAttachment: "fixed",
          color: "#FFFFFF",
          fontFamily: "'Inter', sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top Navigation Bar (Expo-inspired design §DESIGN.md) */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            height: "64px",
            backgroundColor: "rgba(13, 14, 18, 0.8)",
            backdropFilter: "blur(16px) saturate(160%)",
            WebkitBackdropFilter: "blur(16px) saturate(160%)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <span
                style={{
                  color: "#F0B90B",
                  fontWeight: 900,
                  fontSize: "20px",
                  letterSpacing: "1px",
                  textShadow: "0 0 16px rgba(240, 185, 11, 0.35)",
                }}
              >
                SPECTRA
              </span>
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
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

            <nav style={{ display: "flex", gap: "6px", fontSize: "13px" }}>
              <a
                href="/"
                style={{
                  color: "#EAECEF",
                  fontWeight: 600,
                  textDecoration: "none",
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  transition: "all 0.15s ease",
                }}
              >
                Market Intel
              </a>
              <a
                href="/flow"
                style={{
                  color: "#848E9C",
                  fontWeight: 500,
                  textDecoration: "none",
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  transition: "all 0.15s ease",
                }}
              >
                Flow Radar
              </a>
              <a
                href="/forge"
                style={{
                  color: "#848E9C",
                  fontWeight: 500,
                  textDecoration: "none",
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  transition: "all 0.15s ease",
                }}
              >
                Strategy Forge
              </a>
              <a
                href="/loop"
                style={{
                  color: "#F0B90B",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(240, 185, 11, 0.12)",
                  border: "1px solid rgba(240, 185, 11, 0.25)",
                  boxShadow: "0 0 12px rgba(240, 185, 11, 0.15)",
                }}
              >
                <span>Unified Loop</span>
                <span
                  style={{
                    fontSize: "9px",
                    padding: "1px 5px",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(240, 185, 11, 0.25)",
                    color: "#F0B90B",
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
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "9999px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(8px)",
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
              <span style={{ color: "#EAECEF", fontWeight: 600 }}>BNB Chain 56</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1 }}>{children}</main>

        {/* Sticky Ticker Tape Bottom Bar (§11) */}
        <FooterBar />
      </body>
    </html>
  );
}
