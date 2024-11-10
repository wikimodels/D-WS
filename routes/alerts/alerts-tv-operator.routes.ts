import express from "npm:express@4.18.2";
import { addAlertTv } from "../../controllers/alerts/alerts-tv.controller.ts";

const router = express.Router();

router.post("/alerts/tv", addAlertTv);

export default router;
