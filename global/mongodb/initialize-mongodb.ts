import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import {
  Database,
  MongoClient,
} from "https://deno.land/x/mongo@v0.31.1/mod.ts";

let client: MongoClient | null = null;
export let db: Database | null = null;

const env = await load();

export async function getMongoDb(): Promise<Database> {
  if (!client) {
    client = new MongoClient();
    await client.connect(env["MONGO_DB"]);
    db = client.database("general");
  }
  return db!;
}
