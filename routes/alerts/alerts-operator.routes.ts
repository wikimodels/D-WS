import express from "npm:express@4.18.2";
import {
  getAllAlerts,
  addAlert,
  deleteAlerts,
  updateAlert,
  moveAlerts,
} from "../../controllers/alerts/alerts.controller.ts";

const router = express.Router();
// Routes
router.get("/alerts", getAllAlerts);
router.post("/alerts/add/one", addAlert);
router.delete("/alerts/delete/many", deleteAlerts);
router.post("/alerts/update/one", updateAlert);
router.post("/alerts/move/many", moveAlerts);

export default router;
