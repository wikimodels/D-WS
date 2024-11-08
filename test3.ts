import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
// deno-lint-ignore-file no-explicit-any
import {
  MongoClient,
  Database,
  Collection,
  Bson,
} from "https://deno.land/x/mongo@v0.31.1/mod.ts";

const { MONGO_DB } = await load();
const dbClient = new MongoClient();
await dbClient.connect(MONGO_DB);
const db = dbClient.database("general");
const coll = db.collection("coin-repo");

try {
  // Await the result of `toArray()` to log the documents
  const shit = await coll.find({}).toArray();
  console.log(shit);
  const res = await coll.updateOne(
    { symbol: "BTCUSDT" },
    { $set: { status: "shit" } }
  );
  console.log(res);
} catch (error) {
  console.error("Failed to retrieve documents:", error);
}
