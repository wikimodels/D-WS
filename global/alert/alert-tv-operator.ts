import type { Alert } from "../../models/alerts/alert.ts";
import { AlertsCollections } from "../../models/alerts/alerts-collections.ts";
import { CoinsCollections } from "../../models/coin/coins-collections.ts";
import type { Exchange } from "../../models/shared/exchange.ts";
import type { Status } from "../../models/shared/status.ts";
import { CoinOperator } from "../coins/coin-operator.ts";
import { AlertOperator } from "./alert-operator.ts";

export class AlertTvOperator {
  private static instance: AlertTvOperator;
  private static alerts: Map<string, Alert> = new Map();
  private static logInterval: number | null = null;

  constructor() {}

  public static initializeInstance(): Promise<AlertTvOperator> {
    if (!this.instance) {
      this.instance = new AlertTvOperator();
      // Any async initialization can be added here
    }
    return Promise.resolve(this.instance);
  }

  public static addAlert(symbol: string, alert: Alert): void {
    this.alerts.set(symbol, alert);
    console.log(`Stored alert for symbol ${symbol}:`, alert);
  }

  public static getAlert(symbol: string): Alert | undefined {
    return this.alerts.get(symbol);
  }

  public static clearAlert(symbol: string): void {
    this.alerts.delete(symbol);
  }

  public static startLoggingAlerts(): void {
    // Set up an interval to check and log alerts every minute
    this.logInterval = setInterval(async () => {
      console.log("Current alerts in map:");

      if (this.alerts.size === 0) {
        console.log("No alerts currently stored.");
      } else {
        try {
          const coins = await CoinOperator.getAllCoins(
            CoinsCollections.CoinRepo
          );
          console.log("GOT COINS: ", coins.length);

          for (const [symbol, alert] of this.alerts) {
            const coin = coins.find((c) => c.symbol === symbol);

            if (coin) {
              // Update alert properties based on matched coin data
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

              try {
                // Save the alert to the triggered alerts collection
                const insertResult = await AlertOperator.addAlert(
                  AlertsCollections.TriggeredAlerts,
                  alert
                );
                console.log("===> Insert Result: ", insertResult);
              } catch (error) {
                console.error(
                  `Failed to add alert for symbol '${symbol}':`,
                  error
                );
              }
            }
          }

          // Clear alerts after processing
          this.alerts.clear();
        } catch (error) {
          console.error("Error retrieving coins or updating alerts:", error);
        }
      }
    }, 60000); // Executes every 60 seconds (1 minute)
  }

  // Optional method to stop the interval when needed
  public static stopLoggingAlerts(): void {
    if (this.logInterval) {
      clearInterval(this.logInterval);
      this.logInterval = null;
      console.log("Stopped logging alerts.");
    }
  }
}
