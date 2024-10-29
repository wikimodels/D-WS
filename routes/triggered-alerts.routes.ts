import express from "npm:express@4.18.2";
import {
  getAllTriggeredAlerts,
  removeTriggeredAlertButch,
} from "../controllers/triggered-alerts.controller.ts";

const router = express.Router();
router.get("/triggered-alerts", getAllTriggeredAlerts);
router.post("/triggered-alerts/remove-butch", removeTriggeredAlertButch);

export default router;
