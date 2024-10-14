import { AlertObj } from "./alert-obj.ts";

export interface AlertsRepo {
  symbol: string;
  alerts: AlertObj[];
}
