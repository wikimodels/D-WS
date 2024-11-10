import { notifyAboutFailedFunction } from "../../functions/tg/notifications/failed-function.ts";
import type { Alert } from "../../models/alerts/alert.ts";
import type {
  DeleteResult,
  InsertResult,
  ModifyResult,
  MoveResult,
} from "../../models/mongodb/operations.ts";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";

const { PROJECT_NAME } = await load();

export class AlertOperator {
  private static instance: AlertOperator | null = null;
  private static readonly PROJECT_NAME = PROJECT_NAME;
  private static readonly CLASS_NAME = "AlertOperator";
  constructor() {}
  public static initializeInstance() {
    return AlertOperator.instance;
  }

  public static async getAllAlerts(collectionName: string): Promise<Alert[]> {
    let kv;
    const alerts: Alert[] = [];
    try {
      kv = await Deno.openKv();
      const iter = kv.list({ prefix: [collectionName] });

      for await (const entry of iter) {
        alerts.push(entry.value as Alert);
      }
      return alerts;
    } catch (error) {
      console.error("Error getting alerts:", error);
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME}:getAlerts() ---> Failed to get documents`;
      console.error(errorMsg, error);
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "getAlerts()",
        error
      );
      throw error; // Re-throw to propagate the error
    } finally {
      if (kv) {
        await kv.close();
      }
    }
  }

  public static async addAlert(
    collectionName: string,
    alert: Alert
  ): Promise<InsertResult> {
    let kv;
    alert.id = crypto.randomUUID();
    try {
      kv = await Deno.openKv();
      await kv.set([collectionName, alert.id], alert);
      return { inserted: true, insertedCount: 1 } as InsertResult;
    } catch (error) {
      console.error("Error adding alerts:", error);
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME}:addAlert() ---> Failed to add document`;
      console.error(errorMsg, error);
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "addAlert",
        error
      );
      throw error; // Re-throw to propagate the error
    } finally {
      if (kv) {
        await kv.close();
      }
    }
  }

  public static async updateAlert(
    collectionName: string,
    alert: Alert
  ): Promise<ModifyResult> {
    let kv;
    alert.id = crypto.randomUUID();
    try {
      kv = await Deno.openKv();
      await kv.delete([collectionName, alert.id]);
      await kv.set([collectionName, alert.id], alert);
      return { modified: true, modifiedCount: 1 } as ModifyResult;
    } catch (error) {
      console.error("Error editing alert:", error);
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME}:editAlert() ---> Failed to edit document`;
      console.error(errorMsg, error);
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "editAlert",
        error
      );
      throw error;
    } finally {
      if (kv) {
        await kv.close();
      }
    }
  }

  public static async deleteAlerts(
    collectionName: string,
    ids: string[]
  ): Promise<DeleteResult> {
    let kv;
    let deletedCount = 0;

    try {
      kv = await Deno.openKv();

      for (const id of ids) {
        try {
          // Attempt to delete each symbol
          await kv.delete([collectionName, id]);
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting id '${id}':`, error);
        }
      }

      return {
        deleted: deletedCount > 0,
        deletedCount,
      } as DeleteResult;
    } catch (error) {
      console.error("Error deteting alerts:", error);
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME}:deleteAlerts() ---> Failed to delete document`;
      console.error(errorMsg, error);
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "addAlert",
        error
      );
      throw error;
    } finally {
      if (kv) {
        await kv.close();
      }
    }
  }

  public static async moveAlerts(
    sourceCollection: string,
    targetCollection: string,
    alerts: Alert[]
  ): Promise<MoveResult> {
    let kv;
    let deletedCount = 0;
    let insertCount = 0;

    try {
      kv = await Deno.openKv();

      for (const alert of alerts) {
        try {
          await kv.delete([sourceCollection, alert.id]);
          deletedCount++;
        } catch (error) {
          console.error(
            `Error deleting symbol '${alert.symbol}' from '${sourceCollection}':`,
            error
          );
        }

        try {
          await kv.set([targetCollection, alert.id], alert);
          insertCount++;
        } catch (error) {
          console.error(
            `Error inserting symbol '${alert.symbol}' into '${targetCollection}':`,
            error
          );
        }
      }

      return {
        moved: deletedCount > 0 && deletedCount === insertCount,
        insertCount: insertCount,
        deleteCount: deletedCount,
      } as MoveResult;
    } catch (error) {
      console.error("Error deteting alerts:", error);
      const errorMsg = `${this.PROJECT_NAME}:${this.CLASS_NAME}:moveAlerts() ---> Failed to move documents`;
      console.error(errorMsg, error);
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "moveAlerts",
        error
      );
      throw error;
    } finally {
      if (kv) {
        await kv.close();
      }
    }
  }
}
