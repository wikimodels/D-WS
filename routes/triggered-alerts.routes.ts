import express from "npm:express@4.18.2";
import {
  getAllTriggeredAlerts,
  removeTriggeredAlertBatch,
} from "../controllers/triggered-alerts.controller.ts";

const router = express.Router();
router.get("/triggered-alerts", getAllTriggeredAlerts);
router.delete("/triggered-alerts/remove-batch", removeTriggeredAlertBatch);

export default router;
