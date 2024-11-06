import { runRefreshmentProcedure } from "./../../controllers/coins/coin-provider.controller.ts";
import express from "npm:express@4.18.2";

const router = express.Router();
// Routes
router.get("/coins/refreshment-procedure/run", runRefreshmentProcedure);

export default router;
