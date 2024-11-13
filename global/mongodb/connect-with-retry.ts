import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import {
  MongoClient,
  Database,
} from "https://deno.land/x/mongo@v0.31.1/mod.ts";

// Load environment variables
const env = await load();

// MongoDB URI and configuration
const MONGO_URI = env["MONGO_DB"] || "your_default_mongo_uri"; // Fallback to default if not set

let client: MongoClient | null = null;
let db: Database | null = null;

// Function to connect with retry logic
async function connectWithRetry(): Promise<MongoClient> {
  const maxRetries = 5; // Number of retry attempts
  const retryDelay = 2000; // Delay between retries (in ms)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const newClient = new MongoClient();
      await newClient.connect(MONGO_URI);
      console.log("Connected to MongoDB!");
      return newClient; // Return the connected client
    } catch (err) {
      console.error(`Connection attempt ${attempt} failed:`, err);

      // If all attempts fail, throw an error
      if (attempt === maxRetries) {
        throw new Error("Failed to connect to MongoDB after multiple attempts");
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error("Unable to establish connection to MongoDB"); // Fallback error
}

// Function to get the MongoDB database instance
export async function getDatabase(dbName: string): Promise<Database> {
  if (!client) {
    client = await connectWithRetry(); // Connect with retry logic
  }

  if (!db) {
    db = client.database(dbName); // Set the database instance once connected
  }

  return db!; // Return the database instance
}

// Example of a method to retrieve a collection (you can use this in your business logic)
export async function getCollection(collectionName: string, dbName: string) {
  const dbInstance = await getDatabase(dbName); // Ensure connection and DB are ready
  return dbInstance.collection(collectionName);
}
