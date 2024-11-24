import express from "npm:express@4.18.2";
import {
  deleteCoins,
  updateCoin,
  getAllCoins,
  addCoin,
  addCoins,
  getCoinsRepoStatistics,
  updateCoins,
  getCoinsByCollectionName,
} from "../../controllers/coins/coin-operator.controller.ts";

const router = express.Router();
// Routes
router.get("/coins", getAllCoins);
router.get("/coins/collection-name", getCoinsByCollectionName);
router.post("/coins/add/one", addCoin);
router.post("/coins/add/many", addCoins);
router.put("/coins/update/one", updateCoin);
router.put("/coins/update/many", updateCoins);
router.delete("/coins/delete/many", deleteCoins);
router.get("/coins/repo/statistics", getCoinsRepoStatistics);

export default router;
