import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { getSantimentQuery } from "./global/utils/santiment/santiment-query.ts";
import {
  currentMonth,
  monthsAgo,
} from "./global/utils/santiment/santiment-dates.ts";
import { notifyAboutFailedFunction } from "./functions/tg/notifications/failed-function.ts";

// Define API Key and Base URL
const { SANTIMENT_API_KEY, SANTIMENT_API_URL } = await load();

// Define the metrics you want to fetch

const url = `${SANTIMENT_API_URL}`;

const timeNow = currentMonth();
const timeAgo = monthsAgo(6);

const slug = "solana";
// Define headers with the API key
const headers = {
  Authorization: `Basic ${SANTIMENT_API_KEY}`,
  "Content-Type": "application/json",
};
const metric: string = "sentiment_positive_total";
// Fetch data from the Sentiment API
async function fetchSentimentData(
  slug: string,
  metric: string,
  fromTime: string,
  toTime: string
) {
  try {
    const query = getSantimentQuery(slug, metric, fromTime, toTime);
    const response = await fetch(url, {
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
        "FUCK",
        "SANTIMENT_PROVIDER",
        "fetchSentimentData",
        JSON.stringify(data.errors[0])
      );
      console.error(`Error: ${response.status} - ${response.statusText}`);
      return;
    }
    const timeseriesData = data?.data?.getMetric?.timeseriesData;
    if (timeseriesData) {
      console.log("Timeseries Data:", timeseriesData);
      return timeseriesData; // Return or further process this data as needed
    } else {
      console.error("Timeseries data not found in the response.");
      return [];
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
}

// Run the function to fetch data
const data = await fetchSentimentData(slug, metric, timeNow, timeAgo);
//console.log(data);
