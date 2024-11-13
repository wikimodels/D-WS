import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import type { Alert } from "../../models/alerts/alert.ts";
import type { Exchange } from "../../models/shared/exchange.ts";
import type { Status } from "../../models/shared/status.ts";
import { DColors } from "../../models/shared/colors.ts";
import type { Coin } from "../../models/coin/coin.ts";

const { PROJECT_NAME } = await load();
export class AlertTvOperator {
  private static instance: AlertTvOperator;
  private static PROJECT_NAME = PROJECT_NAME;
  private static CLASS_NAME = "AlertTvOperator";
  private static alerts: Map<string, Alert[]> = new Map();

  constructor() {}

  public static initializeInstance(): Promise<AlertTvOperator> {
    if (!this.instance) {
      this.instance = new AlertTvOperator();
      // Any async initialization can be added here
    }
    console.log(
      `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> initialized...`,
      DColors.yellow
    );
    return Promise.resolve(this.instance);
  }

  public static addTvAlert(symbol: string, alert: Alert): void {
    if (!this.alerts.has(symbol)) {
      this.alerts.set(symbol, []); // Initialize an empty array for the symbol if it doesn't exist
    }
    this.alerts.get(symbol)?.push(alert); // Add the alert to the array for the symbol
  }

  public static getAllTvAlertsFromRepo(coins: Coin[]): Alert[] {
    const alerts = Array.from(this.alerts.values()).flat();
    alerts.forEach((alert) => {
      const coin = coins.find((coin) => coin.symbol == alert.symbol);
      if (coin) {
        alert.isTv = true;
        alert.binanceExch = coin.binanceExch;
        alert.bybitExch = coin.bybitExch;
        alert.tvLink = coin.tvLink;
        alert.cgLink = coin.cgLink;
        alert.category = coin.category;
        alert.exchange = coin.exchange as Exchange;
        alert.status = coin.status as Status;
        alert.coinExchange = coin.coinExchange;
        alert.image_url = coin.image_url;
        alert.isActive = true;
      }
    });
    return alerts;
  }

  public static clearAllTvAlerts(): void {
    const clearedAlertsCount = this.alerts.size;
    this.alerts.clear(); // Clear all alerts in the map
    console.log(`${clearedAlertsCount} alerts have been cleared.`);
  }
}
