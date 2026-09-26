// Notification Service (§5.7)
// Aggregates alerts, trade confirmations, and policy changes across channels.

import { randomUUID } from "node:crypto";
import type { AlphaSignal } from "../types/signal.js";

export type NotificationType =
  | "SIGNAL_ALERT"
  | "TRADE_CONFIRMATION"
  | "POLICY_ALERT"
  | "MARKET_STATUS";

export type NotificationChannel = "websocket" | "telegram" | "dashboard" | "all";

export interface SpectraNotification {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  ticker?: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  data?: Record<string, unknown>;
  timestamp: number;
}

export class NotificationService {
  private readonly listeners: Array<(notification: SpectraNotification) => void> = [];
  private readonly history: SpectraNotification[] = [];
  private readonly maxHistory: number;

  constructor(maxHistory = 100) {
    this.maxHistory = maxHistory;
  }

  /**
   * Dispatches a notification to all registered listeners (e.g. WebSocket, Telegram).
   */
  public notify(notification: SpectraNotification): void {
    this.history.unshift(notification);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    for (const listener of this.listeners) {
      try {
        listener(notification);
      } catch {
        // Safe dispatch: errors in one listener do not block others
      }
    }
  }

  /**
   * Subscribes to notification dispatches. Returns an unsubscribe function.
   */
  public onNotification(listener: (notification: SpectraNotification) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) {
        this.listeners.splice(idx, 1);
      }
    };
  }

  /**
   * Retrieves recent notifications in reverse chronological order.
   */
  public getRecent(limit = 20): SpectraNotification[] {
    return this.history.slice(0, limit);
  }

  /**
   * Clears notification history.
   */
  public clear(): void {
    this.history.length = 0;
  }

  /**
   * Generates a notification from an AlphaSignal.
   */
  public createFromSignal(signal: AlphaSignal): SpectraNotification {
    const isCritical = signal.severity === "critical";
    const notification: SpectraNotification = {
      id: `notif-sig-${randomUUID()}`,
      type: "SIGNAL_ALERT",
      channel: isCritical ? "all" : "dashboard",
      title: `${signal.type} Alert: ${signal.ticker}`,
      message: isCritical
        ? `🚨 CRITICAL HALT on ${signal.ticker}: ${signal.type} triggered (${signal.value.toString()} bps)`
        : `Active signal on ${signal.ticker}: ${signal.type} (${signal.severity})`,
      ticker: signal.ticker,
      severity: isCritical ? "CRITICAL" : signal.severity === "warning" ? "WARNING" : "INFO",
      data: {
        signalId: signal.id,
        signalType: signal.type,
        actionable: signal.actionable,
        value: signal.value.toString(),
      },
      timestamp: Date.now(),
    };

    this.notify(notification);
    return notification;
  }

  /**
   * Generates a trade confirmation notification.
   */
  public createFromTrade(
    ticker: string,
    txHash: string,
    amountUsd: string,
    status = "SUCCESS"
  ): SpectraNotification {
    const notification: SpectraNotification = {
      id: `notif-trade-${randomUUID()}`,
      type: "TRADE_CONFIRMATION",
      channel: "all",
      title: `Trade Executed: ${ticker}`,
      message: `Executed $${amountUsd} on ${ticker}. Status: ${status}. Tx: ${txHash.slice(0, 10)}...`,
      ticker,
      severity: status === "SUCCESS" ? "INFO" : "WARNING",
      data: { txHash, amountUsd, status },
      timestamp: Date.now(),
    };

    this.notify(notification);
    return notification;
  }

  /**
   * Generates a policy constraint alert notification.
   */
  public createFromPolicy(action: string, reason: string): SpectraNotification {
    const notification: SpectraNotification = {
      id: `notif-pol-${randomUUID()}`,
      type: "POLICY_ALERT",
      channel: "all",
      title: `Policy Constraint Triggered`,
      message: `Trade blocked by PolicyVault: ${reason} (Action: ${action})`,
      severity: "CRITICAL",
      data: { action, reason },
      timestamp: Date.now(),
    };

    this.notify(notification);
    return notification;
  }
}
