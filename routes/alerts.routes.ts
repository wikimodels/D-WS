import express from "npm:express@4.18.2";
import {
  getAllAlerts,
  addAlertBatch,
  addAlert,
  removeAllAlerts,
  modifyAlert,
  removeAlertBatch,
} from "../controllers/alerts.controller.ts";

const router = express.Router();

router.get("/alerts", getAllAlerts);
router.post("/alerts/batch-create", addAlertBatch);
router.post("/alerts", addAlert);
router.delete("/alerts", removeAllAlerts);
router.put("/alerts/update", modifyAlert);
router.delete("/alerts/batch-delete", removeAlertBatch);

export default router;
