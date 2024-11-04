import express from "npm:express@4.18.2";
import {
  getAllTriggeredAlerts,
  removeTriggeredAlertBatch,
  updateAlertViaTriggered,
} from "../../controllers/triggered-alerts.controller.ts";

const router = express.Router();
router.get("/triggered/alerts", getAllTriggeredAlerts);
router.delete("/triggered/alerts/delete/batch", removeTriggeredAlertBatch);
router.post("/triggered/alerts/update/alert", updateAlertViaTriggered);

export default router;
