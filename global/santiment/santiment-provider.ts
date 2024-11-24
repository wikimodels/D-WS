// deno-lint-ignore-file
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
// deno-lint-ignore-file no-explicit-any no-explicit-any no-explicit-any
import { _ } from "https://cdn.skypack.dev/lodash";
import { DColors } from "../../models/shared/colors.ts";
import { notifyAboutFailedFunction } from "../../functions/tg/notifications/failed-function.ts";
import { getSantimentQuery } from "../utils/santiment/santiment-query.ts";

import { santimentMetrics } from "../utils/santiment/santiment-metrics.ts";
import type { SantimentItem } from "../../models/santiment/santiment-item.ts";

import {
  MongoClient,
  Database,
  Collection,
} from "https://deno.land/x/mongo@v0.31.1/mod.ts";
import type { Coin } from "../../models/coin/coin.ts";
import { CoinsCollections } from "../../models/coin/coins-collections.ts";
import { CoinOperator } from "../coins/coin-operator.ts";

const { PROJECT_NAME, SANTIMENT_API_URL, SANTIMENT_API_KEY, MONGO_DB } =
  await load();

import { delay } from "../utils/delay.ts";
import { getSantimentEChartOptions } from "../utils/santiment/santiment-echart-options.ts";
import { getFromAndToTime } from "../utils/santiment/santiment-dates.ts";

export class SantimentProvider {
  private static instance: SantimentProvider | null = null;
  private static dbClient: MongoClient | null = null;
  private static db: Database | null = null;
  private static collection: Collection<SantimentItem> | null = null;
  private static readonly dbName = "general";
  private static readonly MONGO_DB = MONGO_DB;
  private static metrics = santimentMetrics;

  private static readonly PROJECT_NAME = PROJECT_NAME;
  private static readonly CLASS_NAME = "SantimentProvider";
  private static readonly SANTIMENT_API_URL = SANTIMENT_API_URL;
  private static readonly SANTIMENT_API_KEY = SANTIMENT_API_KEY;

  private constructor() {}

  private static async connectWithRetry(): Promise<MongoClient> {
    const maxRetries = 15;
    const retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const newClient = new MongoClient();
        await newClient.connect(SantimentProvider.MONGO_DB);
        console.log(
          `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> connected to db`,
          DColors.magenta
        );
        return newClient;
      } catch (err) {
        console.error(`Connection attempt ${attempt} failed:`, err);

        if (attempt === maxRetries) {
          throw new Error(
            "Failed to connect to MongoDB after multiple attempts"
          );
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error("Unable to establish connection to MongoDB");
  }

  private static async getDbConnection(): Promise<Database> {
    if (!this.dbClient) {
      this.dbClient = await this.connectWithRetry();
    }
    if (!this.db) {
      this.db = this.dbClient.database(this.dbName);
    }
    return this.db;
  }

  private static async initializeCollection(): Promise<void> {
    if (!this.collection) {
      const db = await this.getDbConnection();
      this.collection = db.collection<SantimentItem>(
        CoinsCollections.CoinSantiment
      );
      console.log(
        `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> collection initialized`,
        DColors.green
      );
    }
  }

  public static async initializeInstance(): Promise<SantimentProvider> {
    if (!SantimentProvider.instance) {
      try {
        await this.getDbConnection(); // Ensures DB connection is established
        await this.initializeCollection(); // Pre-initialize the collection
        SantimentProvider.instance = new SantimentProvider();
        console.log(
          `%c${SantimentProvider.PROJECT_NAME}:${SantimentProvider.CLASS_NAME} ---> initialized...`,
          DColors.cyan
        );
      } catch (error) {
        console.error("SantimentProvider initialization failed:", error);
        throw error;
      }
    }
    return SantimentProvider.instance;
  }

  public static async fetchMetricData(
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
        return null;
      }

      const data = await response.json();
      if (data.errors) {
        console.error("GraphQL errors:", data.errors);
        return null;
      }

      const timeseriesData = data?.data?.getMetric?.timeseriesData;
      if (timeseriesData) {
        return timeseriesData;
      } else {
        console.error("Timeseries data not found in the response.");
        return null;
      }
    } catch (error) {
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME}:fetchMetricData() ---> failed to fetch metric data`;
      console.error(errorMsg, error);

      // Notify about the failed function with context
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "fetchMetricData",
        error
      );

      // Return a failed InsertResult object
      throw new Error(errorMsg);
    }
  }

  private static async createMetricPromises(
    coin: Coin,
    metrics: any[],
    fromTime: string,
    toTime: string
  ): Promise<Promise<any>[]> {
    try {
      // Create an array of promises for metrics
      const metricPromises = metrics.map(async (metric) => {
        const data = await this.fetchMetricData(
          coin.slug || "",
          metric.metric,
          fromTime,
          toTime
        );

        if (!data || data.length === 0) {
          console.warn(
            `No data found for metric: ${metric.metric} and coin: ${coin.slug}`
          );
          return null; // Skip if no data
        }

        const timestamp = new Date().toISOString();

        return {
          data: data,
          metric: metric.metric,
          lineStyle: metric.lineStyle,
          areaStyle: metric.areaStyle,
          label: metric.label,
          symbol: coin.symbol,
          slug: coin.slug,
          timestamp,
        };
      });

      // Return the array of promises
      return metricPromises;
    } catch (error) {
      console.error("Error creating metric promises:", error);
      throw new Error("Failed to create metric promises");
    }
  }

  public static async runMetricPromisesForCoin(promises: any) {
    try {
      // Fetch all metrics for the coin
      const results = await Promise.all(promises);

      // Filter out null results and empty data
      const filteredResults = results.filter(
        (result): result is SantimentItem =>
          result !== null && result.data.length > 0
      );

      if (this.collection && filteredResults.length > 0) {
        await this.collection.insertMany(filteredResults);
        console.log("Data successfully saved to MongoDB.");
      } else {
        console.warn("No valid data to save.");
      }
    } catch (error) {
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME}:runMetricPromises() ---> failed to insert santiment data`;
      console.error(errorMsg, error);

      // Notify about the failed function with context
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "runMetricPromises",
        error
      );
      throw new Error(errorMsg);
    }
  }

  private static async removeDuplicatesFromSantimentColl(): Promise<void> {
    try {
      // Define the fields that determine uniqueness
      const uniqueFields: (keyof SantimentItem)[] = [
        "symbol",
        "slug",
        "metric",
      ];

      // Use a Map to track unique combinations and their associated _ids
      const uniqueMap: Map<string, string> = new Map();
      const duplicates: string[] = [];

      // Fetch all documents from the collection
      if (this.collection) {
        const cursor = this.collection.find({});

        for await (const record of cursor) {
          // Generate a unique key based on the uniqueFields
          const uniqueKey = uniqueFields
            .map((field) => record[field] || "")
            .join("|");

          if (uniqueMap.has(uniqueKey)) {
            if (record._id) {
              duplicates.push(record._id.toString()); // Track duplicate _id for removal
            }
          } else {
            if (record._id) {
              uniqueMap.set(uniqueKey, record._id.toString()); // Add to the map
            }
          }
        }

        if (duplicates.length > 0) {
          // Remove duplicate records
          const res = await this.collection.deleteMany({
            _id: { $in: duplicates },
          });
          console.log("Delete result:", res);
          console.log("Duplicates successfully removed.");
        } else {
          console.log("No duplicates found.");
        }
      } else {
        console.error("Collection is not initialized.");
      }
    } catch (error) {
      const errorMsg =
        "CoinOperator:removeDuplicatesFromSantimentColl() ---> Failed to process duplicates";
      console.error(errorMsg, error);

      // Notify about the failed function with context
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "removeDuplicatesFromSantimentColl",
        error
      );

      throw new Error(errorMsg);
    }
  }

  public static async findCoinsWithSantimentDataMissing(): Promise<Coin[]> {
    try {
      if (this.collection) {
        // Fetch santiment data and extract unique symbols
        const santimentData = await this.collection.find({}).toArray();
        const uniqueSymbols = [
          ...new Set(santimentData.map((item) => item.symbol)),
        ];

        // Fetch all coins with santimentAvailable flag
        const coins = CoinOperator.getAllCoinsFromRepo().filter(
          (c) => c.santimentAvailable
        );

        // Filter coins whose symbols are not in the uniqueSymbols array
        const filteredCoins = coins.filter(
          (coin) => !uniqueSymbols.includes(coin.symbol)
        );

        // Return the filtered coins
        return filteredCoins;
      } else {
        // If collection is undefined, return an empty array
        console.warn("Collection is not initialized.");
        return [];
      }
    } catch (error) {
      // Improved error message
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME}:findCoinsWithSantimentDataMissing() ---> something went wrong`;
      console.error(errorMsg, error);

      // Notify about the failed function
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "findCoinsWithSantimentDataMissing",
        error
      );

      // Rethrow the error to be handled upstream
      throw new Error(errorMsg);
    }

    if (this.dbClient) {
    }
  }

  public static async provideCoinsWithSantimentData(coins: Coin[]) {
    try {
      const { fromTime, toTime } = getFromAndToTime(6);
      for (const coin of coins) {
        const promises = this.createMetricPromises(
          coin,
          this.metrics,
          fromTime,
          toTime
        );
        await this.runMetricPromisesForCoin(promises);
        delay(30 * 1000);
      }
      await this.removeDuplicatesFromSantimentColl();
    } catch (error) {
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME}:provideCoinsWithSantimentData() ---> failed to insert santiment data`;
      console.error(errorMsg, error);

      // Notify about the failed function with context
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "provideCoinsWithSantimentData",
        error
      );
      throw new Error(errorMsg);
    }
  }

  public static async getEChartOptionsBySymbol(symbol: string): Promise<any[]> {
    if (!this.collection) {
      console.warn("Collection is not initialized.");
      return [];
    }

    let santimentData: any[] = [];
    try {
      // Attempt to fetch data from the collection
      santimentData = await this.collection.find({ symbol }).toArray();

      // Log a warning if no data is found
      if (!santimentData.length) {
        console.warn(`No Santiment data found for symbol: ${symbol}`);
      }

      const echartOptions = getSantimentEChartOptions(santimentData);

      return echartOptions;
    } catch (error) {
      // Handle specific errors like BadResource ID
      if (error instanceof Deno.errors.BadResource) {
        console.error(
          `Bad Resource ID error encountered while fetching data for symbol: ${symbol}`,
          error
        );
        return []; // Return an empty array to prevent crashing
      }

      // Log and rethrow unexpected errors
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME}:getEChartOptionsBySymbol() - Error fetching data for symbol: ${symbol}`;
      console.error(errorMsg, error);

      // Notify about the failed operation
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "getEChartOptionsBySymbol",
        error
      );

      // Rethrow the error to allow further handling
      throw new Error(errorMsg);
    }
  }
}
