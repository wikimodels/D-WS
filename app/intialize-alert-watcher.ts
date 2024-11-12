// initialize-alert-watcher.ts
import { AlertWatcher } from "../global/alert/alert-watcher.ts";

const initializeAlertWatcher = async (): Promise<void> => {
  try {
    await AlertWatcher.initialize();
  } catch (error) {
    console.error("Failed to initialize AlertWatcher:", error);
    throw error;
  }
};

export default initializeAlertWatcher;
