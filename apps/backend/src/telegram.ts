// apps/backend/src/telegram.ts
// Telegram Bot alerts and commands using grammY (Spectra.md §5.7, §8.4)

import { Bot } from "grammy";
import type { BackendServices } from "./app.js";
import type { SpectraNotification } from "@spectra/core";

export interface TelegramBotConfig {
  botToken?: string;
  channelId?: string;
}

export class SpectraTelegramBot {
  private bot?: Bot;
  private readonly services: BackendServices;
  private readonly channelId?: string;
  private readonly sentAlerts: Array<{ chatId?: string; message: string; timestamp: number }> = [];

  constructor(services: BackendServices, config: TelegramBotConfig = {}) {
    this.services = services;
    const token = config.botToken ?? process.env.TELEGRAM_BOT_TOKEN;
    this.channelId = config.channelId ?? process.env.TELEGRAM_CHANNEL_ID;

    if (token) {
      this.bot = new Bot(token);
      this.registerCommands();
    }
  }

  private registerCommands(): void {
    if (!this.bot) return;

    this.bot.command("start", async (ctx) => {
      await ctx.reply(
        "⚡️ *Welcome to Spectra Terminal Bot!*\n" +
          "Empirically-grounded intelligence & agentic execution for tokenized equities on BSC.\n\n" +
          "Available Commands:\n" +
          "• /signals — Active market & flow signals\n" +
          "• /status — Equity market hours & terminal health\n" +
          "• /alerts — Recent trade confirmations & alerts",
        { parse_mode: "Markdown" }
      );
    });

    this.bot.command("signals", async (ctx) => {
      const reply = this.formatSignalsMessage();
      await ctx.reply(reply, { parse_mode: "Markdown" });
    });

    this.bot.command("status", async (ctx) => {
      const reply = await this.formatStatusMessage();
      await ctx.reply(reply, { parse_mode: "Markdown" });
    });

    this.bot.command("alerts", async (ctx) => {
      const reply = this.formatAlertsMessage();
      await ctx.reply(reply, { parse_mode: "Markdown" });
    });
  }

  /**
   * Formats current active signals for Telegram output.
   */
  public formatSignalsMessage(): string {
    const signals = this.services.signalEngine.getActiveSignals();
    if (signals.length === 0) {
      return "📊 *Spectra Signals:*\nNo active divergence or anomaly signals currently detected.";
    }

    let msg = `📊 *Spectra Active Signals (${signals.length}):*\n\n`;
    for (const s of signals.slice(0, 10)) {
      const emoji = s.severity === "critical" ? "🚨" : s.severity === "warning" ? "⚠️" : "ℹ️";
      msg += `${emoji} *${s.ticker}* — \`${s.type}\`\n`;
      msg += `   Severity: ${s.severity} | Value: ${s.value.toString()} bps\n`;
    }
    return msg;
  }

  /**
   * Formats market status and terminal health for Telegram output.
   */
  public async formatStatusMessage(): Promise<string> {
    try {
      const status = await this.services.ingestion.getMarketStatus();
      const stateEmoji = status.isOpen ? "🟢 OPEN" : "🔴 CLOSED";
      return (
        `⏱ *Spectra Market Status:*\n\n` +
        `State: ${stateEmoji}\n` +
        `Data Feed: ${this.services.ingestion.getIsAvailable() ? "AVAILABLE" : "STALE"}\n` +
        `Next Open/Close: ${status.nextOpenTime ?? "N/A"}\n` +
        `Policy Vault: ACTIVE (Kill switch: ${this.services.policyEngine.getUserState("default").currentDailyUsageUsd ? "ENGAGED" : "NORMAL"})`
      );
    } catch {
      return "⏱ *Spectra Market Status:*\nUnable to retrieve market status.";
    }
  }

  /**
   * Formats recent alert notifications for Telegram output.
   */
  public formatAlertsMessage(): string {
    const notifs = this.services.notificationService?.getRecent(5) ?? [];
    if (notifs.length === 0) {
      return "🔔 *Spectra Recent Alerts:*\nNo recent alerts logged.";
    }

    let msg = "🔔 *Spectra Recent Alerts:*\n\n";
    for (const n of notifs) {
      msg += `• [${n.severity}] *${n.title}*\n  ${n.message}\n`;
    }
    return msg;
  }

  /**
   * Sends an alert notification to Telegram channel or records it in history.
   */
  public async sendAlert(notification: SpectraNotification): Promise<void> {
    const formatted = `⚡️ *[SPECTRA ${notification.severity}] ${notification.title}*\n${notification.message}`;
    this.sentAlerts.unshift({
      chatId: this.channelId,
      message: formatted,
      timestamp: Date.now(),
    });

    if (this.bot && this.channelId) {
      try {
        await this.bot.api.sendMessage(this.channelId, formatted, { parse_mode: "Markdown" });
      } catch {
        // Safe dispatch: error sending to Telegram does not crash caller
      }
    }
  }

  /**
   * Dispatches a test command programmatically (for testing and shadow mode).
   */
  public async handleCommand(command: string): Promise<string> {
    switch (command.toLowerCase().trim()) {
      case "/start":
        return "Welcome to Spectra Terminal Bot!";
      case "/signals":
        return this.formatSignalsMessage();
      case "/status":
        return await this.formatStatusMessage();
      case "/alerts":
        return this.formatAlertsMessage();
      default:
        return "Unknown command. Use /signals, /status, or /alerts.";
    }
  }

  public getSentAlertsCount(): number {
    return this.sentAlerts.length;
  }

  public getRecentSentAlerts(): Array<{ chatId?: string; message: string; timestamp: number }> {
    return this.sentAlerts.slice(0, 10);
  }
}
