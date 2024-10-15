import { initializeAlertsRepo } from "../../global/alerts/initialize-alerts-repo.ts";

export function cronTaskUpdateAlertsRepo() {
  Deno.cron("Update Alerts Repo", { minute: { every: 2 } }, () => {
    initializeAlertsRepo();
    console.log("Alerts Repo is updated");
  });
}
