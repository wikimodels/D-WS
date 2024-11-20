import express from "npm:express@4.18.2";

import {
  getSantimentDataMissingCoins,
  getSantimentEChartsData,
} from "../../controllers/santiment/santiment-provider.controller.ts";

const router = express.Router();

router.get("/santiment/echarts", getSantimentEChartsData);
router.get("/santiment/coins/data-missing", getSantimentDataMissingCoins);

export default router;
