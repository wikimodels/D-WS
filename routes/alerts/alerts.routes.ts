import express from "npm:express@4.18.2";
import {
  getAllAlerts,
  addAlertBatch,
  addAlert,
  removeAllAlerts,
  modifyAlert,
  removeAlertBatch,
} from "../../controllers/alerts.controller.ts";
import { archiveAlert } from "../../controllers/archived-alerts.controller.ts";

const router = express.Router();

router.get("/alerts", getAllAlerts);
router.post("/alerts/create/batch", addAlertBatch);
router.post("/alerts/create/one", addAlert);
router.delete("/alerts/delete/all", removeAllAlerts);
router.delete("/alerts/delete/batch", removeAlertBatch);
router.put("/alerts/update", modifyAlert);
router.post("/alerts/archive", archiveAlert);

export default router;
