import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";

// Define API Key and Base URL
const { SANTIMENT_API_KEY, SANTIMENT_API_URL } = await load();

// Define the metrics you want to fetch
const metric = "ecosystem_dev_activity";

const url = `${SANTIMENT_API_URL}`;

// Get the current date
const now = new Date();
// Get the date six months ago
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(now.getMonth() - 6);

// Format dates to ISO string
const from = sixMonthsAgo.toISOString();
const to = now.toISOString();
const slug = "solana";
// Define headers with the API key
const headers = {
  Authorization: `Basic ${SANTIMENT_API_KEY}`,
  "Content-Type": "application/json",
};

const query = `
    query {
  getMetric(metric: "${metric}"){
    timeseriesData(
      selector: {slug: "${slug}"}
      from: "${from}"
      to: "${to}"      
      interval: "7d"){
        datetime
        value
    }
  }
}`;

// Fetch data from the Sentiment API
async function fetchSentimentData() {
  try {
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
    console.log("Data received successfully:", data);
  } catch (error) {
    console.error("Request failed:", error);
  }
}

// Run the function to fetch data
fetchSentimentData();
