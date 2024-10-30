import express from "npm:express@4.18.2";
import {
  archiveAlert,
  deleteAllArchivedAlerts,
  deleteArchivedAlertsBatch,
  getAllArchivedAlerts,
  updateArchivedAlert,
} from "../controllers/archived-alerts.controller.ts";

const router = express.Router();

router.get("/archive/alerts", getAllArchivedAlerts);
router.post("/archive/alert", archiveAlert);
router.delete("/archive/alerts/batch", deleteArchivedAlertsBatch);
router.delete("/archive/alerts/all", deleteAllArchivedAlerts);
router.put("/archive/alert", updateArchivedAlert);

export default router;
