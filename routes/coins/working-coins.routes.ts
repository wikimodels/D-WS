import express from "npm:express@4.18.2";
import {
  getAllCoinsAtWork,
  addCoinsToWork,
  deleteAllCoinsFromWork,
  deleteCoinBatchFromWork,
} from "../../controllers/working-coins.conrtoller.ts";

const router = express.Router();

// Routes
router.get("/coins/work", getAllCoinsAtWork);
router.post("/coins/work/add", addCoinsToWork);
router.delete("/coins/work/delete/all", deleteAllCoinsFromWork);
router.delete("/coins/work/delete/batch", deleteCoinBatchFromWork);

export default router;
