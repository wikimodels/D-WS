import express from "npm:express@4.18.2";
import {
  addCoinToDb,
  deleteCoinFromDb,
  getAllCoins,
  updateCoinInDb,
} from "../controllers/coins.controller.ts";

const router = express.Router();
router.get("/coins", getAllCoins);
router.post("/add-coin", addCoinToDb);
router.post("/delete-coin", deleteCoinFromDb);
router.post("/update-coin", updateCoinInDb);

export default router;
