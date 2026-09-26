// apps/web/src/app/components/FooterBar.tsx
"use client";

import React from "react";
import { TickerTape } from "@spectra/ui";

export function FooterBar() {
  return (
    <TickerTape
      marketOpen={true}
      wsStatus="CONNECTED"
      gasGwei="3 Gwei"
      lastUpdated="Just now"
    />
  );
}
