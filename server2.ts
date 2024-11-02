import { Application } from "npm:express@4.18.2";

import initializeApp from "./app/initialize-app.ts";
import initializeCoinRepository from "./app/intialize-dependencies.ts";
import { DColors } from "./models/shared/colors.ts";
import initializeCoinProveider from "./app/initialize-coin-provider.ts";
initializeCoinRepository()
  .then(() => initializeCoinProveider())
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
