import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import type { Alert } from "../../models/alerts/alert.ts";
import { AlertOperator } from "./alert-operator.ts";
import { AlertsCollections } from "../../models/alerts/alerts-collections.ts";
import {
  clearKlineRepo,
  getLatestDataFromKlineRepo,
} from "../kline/kline-repo.ts";
import { notifyAboutTriggeredAlerts } from "../../functions/tg/notifications/triggered-alertst.ts";
import { DColors } from "../../models/shared/colors.ts";
import { notifyAboutFailedFunction } from "../../functions/tg/notifications/failed-function.ts";
import { UnixToTime } from "../../functions/utils/time-converter.ts";
import { AlertTvOperator } from "./alert-tv-operator.ts";
import { CoinOperator } from "../coins/coin-operator.ts";
import { CoinsCollections } from "../../models/coin/coins-collections.ts";

const { PROJECT_NAME } = await load();

// alert-watcher.ts
export class AlertWatcher {
  private static readonly PROJECT_NAME = PROJECT_NAME;
  private static readonly CLASS_NAME = "AlertWatcher";

  // The main interval-based watcher function
  private static watchAlertsAgainstKlineRepo(): Promise<void> {
    return new Promise((resolve) => {
      setInterval(async () => {
        try {
          const coins = CoinOperator.getAllCoinsFromRepo().filter(
            (c) => c.collection == CoinsCollections.CoinRepo
          );
          const alerts = await AlertOperator.getAllWorkingAlertsFromRepo();
          const alertsTv = await AlertTvOperator.getAllTvAlertsFromRepo(coins);

          const triggeredAlerts: Alert[] = [...alertsTv];

          alerts.forEach((alert) => {
            const candle = getLatestDataFromKlineRepo(alert.symbol);
            if (
              alert.isActive &&
              candle &&
              candle.low <= alert.price &&
              candle.high >= alert.price
            ) {
              const activationTime = new Date().getTime();
              alert.activationTime = activationTime;
              alert.activationTimeStr = UnixToTime(activationTime);
              alert.description = `high: ${candle.high} low: ${candle.low} price: ${alert.price}`;
              triggeredAlerts.push(alert);
            }
          });

          clearKlineRepo();
          AlertTvOperator.clearAllTvAlerts();

          // Only insert and notify if there are triggered alerts
          if (triggeredAlerts.length > 0) {
            const insertResult = await AlertOperator.addMany(
              AlertsCollections.TriggeredAlerts,
              triggeredAlerts
            );
            await notifyAboutTriggeredAlerts(triggeredAlerts);

            console.log(
              `%c${this.PROJECT_NAME}:${this.CLASS_NAME}:watchAlertsAgainstKlineRepo ---> InsertResult `,
              DColors.magenta,
              insertResult
            );
          } else {
            console.log(
              `%c${this.PROJECT_NAME}:${this.CLASS_NAME}:watchAlertsAgainstKlineRepo ---> No alerts triggered`,
              DColors.blue
            );
          }
        } catch (error) {
          console.error("Error in watchAlertsAgainstKlineRepo:", error);
          await notifyAboutFailedFunction(
            this.PROJECT_NAME,
            this.CLASS_NAME,
            "watchAlertsAgainstKlineRepo",
            error
          );
        }
      }, 20 * 1000);

      // Resolve immediately after starting the interval to allow chaining
      resolve();
    });
  }

  // Wrapper method for easier chaining
  public static initialize(): Promise<void> {
    console.log(
      `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> initialized...`,
      DColors.yellow
    );
    return this.watchAlertsAgainstKlineRepo();
  }
}
