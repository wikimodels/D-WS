import { notifyAboutFailedFunction } from "../../functions/tg/notifications/failed-function.ts";
import type { Alert } from "../../models/alerts/alert.ts";
import { AlertsCollections } from "../../models/alerts/alerts-collections.ts";
import type {
  DeleteResult,
  InsertResult,
  ModifyResult,
  MoveResult,
} from "../../models/mongodb/operations.ts";
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { DColors } from "../../models/shared/colors.ts";

const { PROJECT_NAME } = await load();

export class AlertOperator {
  private static instance: AlertOperator | null = null;
  private alertsAtWorkRepo = new Map<string, Alert[]>();
  private static readonly PROJECT_NAME = PROJECT_NAME;
  private static readonly CLASS_NAME = "AlertOperator";

  private constructor() {
    this.initializeAlertsAtWorkRepo(); // Initialize alertsAtWorkRepo on instantiation
  }

  // Singleton pattern to ensure a single instance
  // Singleton pattern to ensure a single instance
  public static async initializeInstance(): Promise<AlertOperator> {
    if (!AlertOperator.instance) {
      const instance = new AlertOperator(); // Create the instance
      await instance.initializeAlertsAtWorkRepo(); // Perform async initialization
      AlertOperator.instance = instance; // Set the singleton instance
    }
    console.log(
      `%c${this.PROJECT_NAME}:${this.CLASS_NAME} ---> initialized...`,
      DColors.magenta
    );
    return AlertOperator.instance;
  }

  // Initialize alertsAtWorkRepo from KV storage
  private async initializeAlertsAtWorkRepo() {
    try {
      const alerts = await AlertOperator.getAllAlerts(
        AlertsCollections.WorkingAlerts
      );
      this.alertsAtWorkRepo.set(AlertsCollections.WorkingAlerts, alerts);
    } catch (error) {
      console.error(
        `${AlertOperator.PROJECT_NAME}:${AlertOperator.CLASS_NAME}:initializeAlertsAtWorkRepo() ---> Failed to initialize alertsAtWorkRepo`,
        error
      );
    }
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
      if (
        collectionName === AlertsCollections.WorkingAlerts &&
        AlertOperator.instance
      ) {
        AlertOperator.instance.alertsAtWorkRepo.set(
          AlertsCollections.WorkingAlerts,
          alerts
        );
      }
      return alerts;
    } catch (error) {
      console.error("Error getting alerts:", error);
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "getAlerts()",
        error
      );
      throw error;
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
      await this.refreshWorkingAlerts(collectionName);
      return { inserted: true, insertedCount: 1 } as InsertResult;
    } catch (error) {
      console.error("Error adding alerts:", error);
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

  public static async addMany(
    collectionName: string,
    alerts: Alert[]
  ): Promise<InsertResult> {
    let kv;
    let insertedCount = 0;
    try {
      kv = await Deno.openKv();
      for (const alert of alerts) {
        alert.id = crypto.randomUUID();
        await kv.set([collectionName, alert.id], alert);
        insertedCount++;
      }
      await this.refreshWorkingAlerts(collectionName);
      return { inserted: true, insertedCount } as InsertResult;
    } catch (error) {
      console.error("Error adding multiple alerts:", error);
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "addMany",
        error
      );
      throw error;
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
      await this.refreshWorkingAlerts(collectionName);
      return { modified: true, modifiedCount: 1 } as ModifyResult;
    } catch (error) {
      console.error("Error editing alert:", error);
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
          await kv.delete([collectionName, id]);
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting id '${id}':`, error);
        }
      }
      await this.refreshWorkingAlerts(collectionName);
      return { deleted: deletedCount > 0, deletedCount } as DeleteResult;
    } catch (error) {
      console.error("Error deleting alerts:", error);
      await notifyAboutFailedFunction(
        this.PROJECT_NAME,
        this.CLASS_NAME,
        "deleteAlerts",
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
            `Error deleting alert from '${sourceCollection}':`,
            error
          );
        }
        try {
          await kv.set([targetCollection, alert.id], alert);
          insertCount++;
        } catch (error) {
          console.error(
            `Error inserting alert into '${targetCollection}':`,
            error
          );
        }
      }
      await this.refreshWorkingAlerts(sourceCollection);
      await this.refreshWorkingAlerts(targetCollection);
      return {
        moved: deletedCount > 0 && deletedCount === insertCount,
        insertCount,
        deleteCount: deletedCount,
      } as MoveResult;
    } catch (error) {
      console.error("Error moving alerts:", error);
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

  public static async getAllWorkingAlertsFromRepo(): Promise<Alert[]> {
    const instance = await AlertOperator.initializeInstance();
    return Array.from(instance.alertsAtWorkRepo.values()).flatMap(
      (alertsArray) => alertsArray
    );
  }

  private static async refreshWorkingAlerts(collectionName: string) {
    if (
      collectionName === AlertsCollections.WorkingAlerts &&
      AlertOperator.instance
    ) {
      const alerts = await AlertOperator.getAllAlerts(
        AlertsCollections.WorkingAlerts
      );
      AlertOperator.instance.alertsAtWorkRepo.set(
        AlertsCollections.WorkingAlerts,
        alerts
      );
    }
  }
}
