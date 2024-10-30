import express from "npm:express@4.18.2";
import {
  getAllCoinsAtWork,
  addCoinsToWork,
  deleteAllCoinsFromWork,
  deleteCoinBatchFromWork,
} from "../controllers/coins-at-work.conrtoller.ts";

const router = express.Router();

// Routes
router.get("/coins/work", getAllCoinsAtWork);
router.post("/coins/work/coin", addCoinsToWork);
router.delete("/coins/work/all", deleteAllCoinsFromWork);
router.delete("/coins/work/batch", deleteCoinBatchFromWork);

export default router;
