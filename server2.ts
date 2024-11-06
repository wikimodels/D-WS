import { Application } from "npm:express@4.18.2";
import initializeApp from "./app/initialize-app.ts";
import initializeCoinRepository from "./app/intialize-coin-repository.ts";
import { DColors } from "./models/shared/colors.ts";
import initializeCoinProvider from "./app/initialize-coin-provider.ts";
import initializeCoinOperator from "./app/intialize-coin-operator.ts";
initializeCoinOperator()
  .then(() => initializeCoinRepository())
  .then(() => initializeCoinProvider())
  .then(() => initializeApp())
  .then((app: Application) => {
    //runBinanceWSConnections();
    //runBybitWSConnections();
    //const coinRefresh = CoinRefresh.getInstance();
    //coinRefresh.scheduleRefresh();
    app.listen({ port: 80 }, "0.0.0.0", () => {
      console.log("%cServer ---> running...", DColors.green);
    });
  });
