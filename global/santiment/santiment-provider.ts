// deno-lint-ignore-file
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
// deno-lint-ignore-file no-explicit-any no-explicit-any no-explicit-any
import { _ } from "https://cdn.skypack.dev/lodash";
import { DColors } from "../../models/shared/colors.ts";
import { notifyAboutFailedFunction } from "../../functions/tg/notifications/failed-function.ts";
import { getSantimentQuery } from "../utils/santiment/santiment-query.ts";

import { formatFailedDataNotificationMsg } from "../../functions/tg/formatters/coin-msg/failed-data-notification.ts";
import { sendTgGeneralMessage } from "../../functions/tg/send-general-tg-msg.ts";
import { santimentMetrics } from "../utils/santiment/santiment-metrics.ts";
import type { SantimentItem } from "../../models/santiment/santiment-item.ts";
import { getSantimentEChartOptions } from "../utils/santiment/santiment-echart-options.ts";
import { testSantimentItems } from "../utils/santiment/santiment-test-data.ts";

const { PROJECT_NAME, SANTIMENT_API_URL, SANTIMENT_API_KEY } = await load();

type SuccessResult = {
  success: boolean;
  symbol: string;
  metric: string;
  label: string;
  slug: string;
  areaStyle: any;
  lineStyle: any;
  data: { datetime: string; value: number }[];
};

type FailureResult = {
  success: boolean;
  symbol: string;
  metric: string;
  slug: string;
  error: any;
};

type Result = {
  metric: string;
  slug: string;
  areaStyle?: any;
  label?: string;
  lineStyle?: any;
  symbol: string;
  success: boolean;
  data?: { datetime: string; value: number }[];
  error?: string;
};

export class SantimentProvider {
  private static metrics = santimentMetrics;
  private static instance: SantimentProvider;
  private static readonly PROJECT = PROJECT_NAME;
  private static readonly CLASS_NAME = "SantimentProvider";
  private static readonly SANTIMENT_API_URL = SANTIMENT_API_URL;
  private static readonly SANTIMENT_API_KEY = SANTIMENT_API_KEY;

  private constructor() {}

  public static initializeInstance(): Promise<SantimentProvider> {
    if (!this.instance) {
      this.instance = new SantimentProvider();
      // Any async initialization can be added here
    }
    console.log("%cSantimentProvider ---> initialized...", DColors.green);
    return Promise.resolve(this.instance);
  }

  private static async fetchSentimentData(
    slug: string,
    metric: string,
    fromTime: string,
    toTime: string
  ) {
    try {
      const headers = {
        Authorization: `Basic ${this.SANTIMENT_API_KEY}`,
        "Content-Type": "application/json",
      };
      const query = getSantimentQuery(slug, metric, fromTime, toTime);
      const response = await fetch(this.SANTIMENT_API_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        console.error("Error details:", errorText);
        return;
      }

      const data = await response.json();
      if (data.errors) {
        await notifyAboutFailedFunction(
          this.PROJECT,
          this.CLASS_NAME,
          "fetchSentimentData",
          JSON.stringify(data.errors[0])
        );
        console.error(`Error: ${response.status} - ${response.statusText}`);
        return;
      }
      const timeseriesData = data?.data?.getMetric?.timeseriesData;
      if (timeseriesData) {
        return timeseriesData; // Return or further process this data as needed
      } else {
        console.error("Timeseries data not found in the response.");
        throw Error("timeseriesData is missign. Check for errors");
      }
    } catch (error) {
      console.error("Request failed:", error);
    }
  }

  private static createSantimentPromises(
    slug: string,
    symbol: string,
    fromDate: string,
    toDate: string
  ): Promise<Result>[] {
    return this.metrics.map(async ({ metric, label, areaStyle, lineStyle }) => {
      try {
        const data = await this.fetchSentimentData(
          slug,
          metric,
          fromDate,
          toDate
        );
        return {
          success: true,
          areaStyle,
          lineStyle,
          symbol,
          metric,
          label,
          slug,
          data,
        } as SuccessResult;
      } catch (error) {
        console.error(`Failed to fetch data for ${metric} (${symbol}):`, error);
        return {
          success: false,
          symbol,
          metric,
          label,
          slug,
          error: (error as Error).message,
          data: undefined, // for consistent structure
        } as FailureResult;
      }
    });
  }

  private static async runSantimentPromises(
    promises: Promise<Result>[]
  ): Promise<{
    successfulData: SuccessResult[];
    failedData: FailureResult[];
  }> {
    // Execute all promises
    const results = await Promise.all(promises);

    // Separate successful and failed results
    const successfulData = results
      .filter((result) => result.success)
      .map((result) => ({
        lineStyle: result.lineStyle,
        areaStyle: result.areaStyle,
        label: result.label,
        metric: result.metric,
        slug: result.slug,
        symbol: result.symbol,
        data: result.data,
      })) as SuccessResult[];

    const failedData = results
      .filter((result) => !result.success)
      .map(
        (result) =>
          ({
            slug: result.slug,
            metric: result.metric,
            symbol: result.symbol,
            error: result.error,
          } as FailureResult)
      );

    return { successfulData, failedData };
  }

  private static createEChartOptions(items: SantimentItem[]): any[] {
    return items.map((item) => getSantimentEChartOptions(item));
  }

  public static async getSantimentEChartsData(
    slug: string,
    symbol: string,
    fromDate: string,
    toDate: string
  ): Promise<SantimentItem[]> {
    const promises = this.createSantimentPromises(
      slug,
      symbol,
      fromDate,
      toDate
    );

    //const result = await this.runSantimentPromises(promises);

    // const echartOptions = this.createEChartOptions(result.successfulData);
    //if (result.failedData.length > 0) {
    //   const symbols = result.failedData.map((d) => d.symbol);
    //   this.sendFailedDataNotification(
    //     this.PROJECT,
    //     this.CLASS_NAME,
    //     "runSantimentDataFecth",
    //     symbols
    //   );
    // }

    // console.log(
    //   `%c${this.PROJECT}:${this.CLASS_NAME} ---> Santiment Successfull Data Fetch: ${result.successfulData.length}`,
    //   DColors.cyan
    // );
    //return echartOptions;
    const echartOptions = this.createEChartOptions(testSantimentItems);
    return echartOptions;
  }
  private static async sendFailedDataNotification(
    projectName: string,
    className: string,
    fnName: string,
    symbols: string[]
  ) {
    const errorMsg = formatFailedDataNotificationMsg(
      projectName,
      className,
      fnName,
      symbols
    );
    await sendTgGeneralMessage(errorMsg);
  }
}
