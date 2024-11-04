import express from "npm:express@4.18.2";
import {
  getAllCoins,
  getBlackListCoins,
  getCoinGeckoMissingCoins,
  getSantimentMissingCoins,
  moveCoinArrayToCoinsColl,
  moveCoinToBlackList,
  removeCoinArray,
  removeCoinArrayFromBlackList,
  removeCoinFromBlackList,
} from "../../controllers/coins/coin-provider.controller.ts";

const router = express.Router();
// Routes
router.get("/coins-provider", getAllCoins);
router.post("/coins-provider/relocate-to-coins", moveCoinArrayToCoinsColl);
router.delete("/coins-provider/delete/many", removeCoinArray);
router.get("/black-list", getBlackListCoins);
router.post("/black-list/add/one", moveCoinToBlackList);
router.delete("/black-list/remove/one", removeCoinFromBlackList);
router.delete("black-list/remove/many", removeCoinArrayFromBlackList);
router.put("/coins-provider/coin-gecko-missing", getCoinGeckoMissingCoins);
router.put("/coins-provider/santiment-missing", getSantimentMissingCoins);

export default router;
