import express from "npm:express@4.18.2";
import {
  deleteAllArchivedAlerts,
  deleteArchivedAlertsBatch,
  getAllArchivedAlerts,
  updateArchivedAlert,
} from "../controllers/archived-alerts.controller.ts";

const router = express.Router();

router.get("/archive/alerts", getAllArchivedAlerts);
router.delete("/archive/delete/batch", deleteArchivedAlertsBatch);
router.get("/archive/delete/all", deleteAllArchivedAlerts);
router.put("/archive/update/one", updateArchivedAlert);

export default router;
