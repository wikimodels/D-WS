import express from "npm:express@4.18.2";
import {
  deleteCoins,
  updateCoin,
  moveCoins,
  getAllCoins,
  addCoin,
} from "../../controllers/coins/coin-operator.controller.ts";

const router = express.Router();
// Routes
router.get("/coins", getAllCoins);
router.post("/coins/add/one", addCoin);
router.delete("/coins/delete/many", deleteCoins);
router.put("/coins/update/one", updateCoin);
router.post("/coins/move/many", moveCoins);

export default router;
