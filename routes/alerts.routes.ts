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
router.post("/alerts/create-butch", addAlertButch);
router.get("/alerts/create", addAlert);
router.post("/alerts/delete-all", removeAllAlerts);
router.post("/alerts/update", modifyAlert);
router.post("/alerts/delete-butch", removeAlertButch);

export default router;
