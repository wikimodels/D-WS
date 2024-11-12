import type { Alert } from "../../models/alerts/alert.ts";

const alertTvRepo = new Map<string, Alert[]>();

export function saveAlertTvToMemory(alert: Alert) {
  if (!alertTvRepo.has(alert.symbol)) {
    alertTvRepo.set(alert.symbol, []);
  }
  const alerts = alertTvRepo.get(alert.symbol)!;

  alerts.push(alert);
}

export function getAllTvAlerts() {
  const allAlerts = Array.from(alertTvRepo.values()).flat();
  return allAlerts;
}

export function clearAlertTv(): void {
  alertTvRepo.clear();
}
