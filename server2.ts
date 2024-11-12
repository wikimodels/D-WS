import { Application } from "npm:express@4.18.2";
import initializeApp from "./app/initialize-app.ts";
import initializeCoinRepository from "./app/intialize-coin-repository.ts";
import { DColors } from "./models/shared/colors.ts";
import initializeCoinProvider from "./app/initialize-coin-provider.ts";
import initializeCoinOperator from "./app/intialize-coin-operator.ts";
import initializeAlertTvOperator from "./app/intialize-alert-tv-operator.ts";
import initializeSantimentProvider from "./app/initialize-santiment-provider.ts";
import runBinanceWSConnections from "./controllers/ws/binance-ws.conroller.ts";
initializeCoinOperator()
  .then(() => initializeCoinRepository())
  .then(() => initializeCoinProvider())
  .then(() => initializeAlertTvOperator())
  .then(() => initializeSantimentProvider())
  .then(() => initializeApp())
  .then((app: Application) => {
    runBinanceWSConnections();
    //runBybitWSConnections();
    //const coinRefresh = CoinRefresh.getInstance();
    //coinRefresh.scheduleRefresh();
    app.listen({ port: 80 }, "0.0.0.0", () => {
      console.log("%cServer ---> running...", DColors.green);
    });
  });
