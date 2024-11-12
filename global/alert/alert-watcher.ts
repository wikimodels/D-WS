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
import { clearAlertTv, getAllTvAlerts } from "./alert-tv-repo.ts";
import { notifyAboutFailedFunction } from "../../functions/tg/notifications/failed-function.ts";
import { UnixToTime } from "../../functions/utils/time-converter.ts";

const { PROJECT_NAME } = await load();

// alert-watcher.ts
export class AlertWatcher {
  private static instance: AlertWatcher | null = null;
  private static readonly PROJECT_NAME = PROJECT_NAME;
  private static readonly CLASS_NAME = "AlertWatcher";

  // The main interval-based watcher function
  private static watchAlertsAgainstKlineRepo(): Promise<void> {
    return new Promise((resolve) => {
      setInterval(async () => {
        try {
          const alerts = await AlertOperator.getAllAlerts(
            AlertsCollections.WorkingAlerts
          );
          const alertsTv = getAllTvAlerts();
          const triggeredAlerts: Alert[] = [];

          [...alerts, ...alertsTv].forEach((alert) => {
            const candle = getLatestDataFromKlineRepo(alert.symbol);
            if (
              candle &&
              candle.low <= alert.price &&
              candle.high >= alert.price
            ) {
              const activationTime = new Date().getTime();
              alert.activationTime = activationTime;
              alert.activationTimeStr = UnixToTime(activationTime);
              triggeredAlerts.push(alert);
            }
          });

          clearKlineRepo();
          clearAlertTv();

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
      }, 60 * 1000);

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
