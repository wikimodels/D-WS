import express from "npm:express@4.18.2";
import {
  addCoinToDb,
  deleteCoinFromDb,
  getAllCoins,
  updateCoinInDb,
} from "../controllers/coins.controller.ts";

const router = express.Router();
// Routes
router.get("/coins", getAllCoins); // GET all coins
router.post("/coins", addCoinToDb); // POST to add a new coin
router.delete("/coins/:id", deleteCoinFromDb); // DELETE a coin by ID
router.put("/coins/:id", updateCoinInDb); // PUT to update a coin by ID

export default router;
