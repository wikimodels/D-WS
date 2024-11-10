import express from "npm:express@4.18.2";

import { getSantimentEChartsData } from "../../controllers/santiment/santiment-provider.controller.ts";

const router = express.Router();

router.get("/santiment/echarts", getSantimentEChartsData);

export default router;
