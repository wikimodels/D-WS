import express from "npm:express@4.18.2";
import {
  getAllCoinsAtWork,
  addCoinsToWork,
  deleteAllCoinsFromWork,
  deleteCoinBatchFromWork,
} from "../controllers/coins-at-work.conrtoller.ts";

const router = express.Router();
router.get("/coins-at-work", getAllCoinsAtWork);
router.post("/coins-at-work/add-to-work", addCoinsToWork);
router.get("/coins-at-work/delete-all-from-work", deleteAllCoinsFromWork);
router.post("/coins-at-work/delete-butch-from-work", deleteCoinBatchFromWork);

export default router;
