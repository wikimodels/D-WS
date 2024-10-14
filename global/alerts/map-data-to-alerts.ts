// deno-lint-ignore-file no-explicit-any
import { AlertObj } from "../../models/alerts/alert-obj.ts";

export function mapDataToAlerts(data: any[]) {
  const alerts: AlertObj[] = [];
  data.forEach((d) => {
    const alert: AlertObj = {
      symbol: d.symbol,
      price: Number(d.price),
      action: d.action,
      isActive: true,
      creationTime: 0,
      activationTime: 0,
      mainImgUrl: d.mainImgUrl,
      description: d.description,
      keyLevelName: d.keyLevelName,
      high: 0,
      low: 0,
    };
    alerts.push(alert);
  });
  return alerts;
}
