import express from "npm:express@4.18.2";

import {
  getAllArchivedAlerts,
  sendAlertToArchive,
  removeAlertButchFromArchive,
  removeAllAlertsFromArchive,
  updateArchivedAlert,
} from "../controllers/archived-alerts.controller.ts";

const router = express.Router();
router.get("/archived-alerts", getAllArchivedAlerts);
router.post("/archived-alerts/send-to-archive", sendAlertToArchive);
router.get(
  "/archived-alerts/remove-butch-from-archive",
  removeAlertButchFromArchive
);
router.post(
  "/archived-alerts/delete-all-from-archive",
  removeAllAlertsFromArchive
);
router.post("/archived-alerts/update", updateArchivedAlert);

export default router;
