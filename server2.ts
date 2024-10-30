import { Application } from "npm:express@4.18.2";

import initializeApp from "./app/initialize-app.ts";
import initializeCoinRepository from "./app/intialize-dependencies.ts";
import { DColors } from "./models/shared/colors.ts";
import runBinanceWSConnections from "./controllers/binance-ws.conroller.ts";
import { runBybitWSConnections } from "./controllers/bybit-ws.conroller.ts";
import listEndpoints from "npm:express-list-endpoints";
import { fetchAllAlerts } from "./functions/kv-db/alerts-crud/alerts/fetch-all-alert.ts";
import alertsRoutes from "./routes/alerts.routes.ts";
initializeCoinRepository()
  .then(() => initializeApp())
  .then(async (app: Application) => {
    //runBinanceWSConnections();
    //runBybitWSConnections();

    app.listen({ port: 80 }, "0.0.0.0", () => {
      console.log("%cServer ---> running...", DColors.green);
    });
  });
