import express from "npm:express@4.18.2";
import {
  closeBinanceWs,
  getBinanceWsStatus,
  startBinanceWs,
} from "../../controllers/ws/binance-ws.conroller.ts";

const router = express.Router();
router.get("/ws/binance/start", startBinanceWs);
router.get("/ws/binance/close", closeBinanceWs);
router.get("/ws/binance/status", getBinanceWsStatus);

export default router;
