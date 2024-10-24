import { AlertsRepo } from "../../models/alerts/alerts-repo.ts";
import { getAllAlertObjs } from "../../functions/kv-db/alerts-crud/alerts/get-all-alert-objs.ts";
import { getCoinsRepo } from "../coins/coins-repo.ts";

export let alertsRepo: AlertsRepo[] = [];

export function getAlertsRepo() {
  const repo = alertsRepo;
  return repo;
}
export async function initializeAlertsRepo() {
  const coins = getCoinsRepo();
  const alerts = await getAllAlertObjs();

  coins.forEach((c) => {
    alertsRepo.push({
      symbol: c.symbol,
      alerts: [],
    });
  });

  alertsRepo.forEach((a) => {
    alerts.forEach((_a) => {
      if (a.symbol == _a.symbol) {
        a.alerts.push(_a);
      }
    });
  });
}
