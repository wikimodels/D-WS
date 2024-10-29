import { getAllAlertObjs } from "./fetch-all-alert.ts";

export async function getAlertByKeyLevelName(data: {
  keyLevelName: string;
  symbol: string;
}) {
  const alerts = await getAllAlertObjs();
  const alert = alerts.find(
    (a) => a.keyLevelName == data.keyLevelName && a.symbol == data.symbol
  );
  return alert;
}
