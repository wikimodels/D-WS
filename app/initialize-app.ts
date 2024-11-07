// initialize-app.ts
import express, { Application } from "npm:express@4.18.2";
import cors from "npm:cors";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts"; //

import binanceWsRoutes from "../routes/ws/binance-ws.routes.ts";
import bybitWsRoutes from "../routes/ws/bybit-ws.routes.ts";
import triggeredAlertsRoutes from "../routes/alerts/triggered-alerts.routes.ts";
import archivedAlertsRoutes from "../routes/alerts/archived-alerts.routes.ts";
import alertsRoutes from "../routes/alerts/alerts.routes.ts";
import coinsOperatorRoutes from "../routes/coins/coins-operator.routes.ts";
import coinsProviderRoutes from "../routes/coins/coins-provider.routes.ts";

const { ORIGIN_I, ORIGIN_II } = await load();
const allowedOrigins = [ORIGIN_I, ORIGIN_II];

const initializeApp = (): Promise<Application> => {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: allowedOrigins,
    })
  );

  // Register routes
  app.use("/api", binanceWsRoutes);
  app.use("/api", bybitWsRoutes);
  app.use("/api", triggeredAlertsRoutes);
  app.use("/api", archivedAlertsRoutes);
  app.use("/api", alertsRoutes);
  app.use("/api", coinsProviderRoutes);
  app.use("/api", coinsOperatorRoutes);

  //   app.get("/alerts", async (_req: any, res: any) => {
  //     try {
  //       //TODO:
  //       console.log("getAllAlerts.controller --> running");
  //       const result = await fetchAllAlerts();
  //       res.status(200).send(result);
  //     } catch (error) {
  //       console.error("Error fetching all alerts:", error);
  //       res.status(500).send({ error: "Failed to fetch alerts." });
  //     }
  //   });

  return app; // Ensure the app is returned
};

export default initializeApp;
