import express from "npm:express@4.18.2";
import {
  startBybitWs,
  closeBybitWs,
  getBybitWsStatus,
} from "../../controllers/ws/bybit-ws.conroller.ts";

const router = express.Router();
router.get("/ws/bybit/start", startBybitWs);
router.get("/ws/bybit/close", closeBybitWs);
router.get("/ws/bybit/status", getBybitWsStatus);

export default router;
