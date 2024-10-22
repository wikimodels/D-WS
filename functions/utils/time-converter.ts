import { datetime } from "https://deno.land/x/ptera@v1.0.2/mod.ts";

export function UnixToISO(unixTimestamp: number) {
  const time = datetime(unixTimestamp);
  const formattedTime = time.format("YYYY-MM-ddTHH:mm:ss.SZ");
  return formattedTime;
}

export function UnixToTime(unixTimestamp: number) {
  const time = datetime(unixTimestamp);
  const formattedTime = time.format("YYYY-MM-dd HH:mm:ss");
  return formattedTime;
}

export function UnixToNamedTimeRu(unixTimestamp: number) {
  const time = new Date(unixTimestamp);

  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  };
  const formattedDate = new Intl.DateTimeFormat("ru-RU", options).format(time);
  return formattedDate;
}
