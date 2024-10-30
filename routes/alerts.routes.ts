import express from "npm:express@4.18.2";
import {
  getAllAlerts,
  addAlertButch,
  addAlert,
  removeAllAlerts,
  modifyAlert,
  removeAlertButch,
} from "../controllers/alerts.controller.ts";

const router = express.Router();

router.get("/alerts", getAllAlerts);
// router.post("/alerts/batch-create", addAlertButch);
// router.post("/alerts", addAlert);
// router.delete("/alerts", removeAllAlerts);
// router.put("/alerts/update", modifyAlert);
// router.delete("/alerts/batch-delete", removeAlertButch);

export default router;
