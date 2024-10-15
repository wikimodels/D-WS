export async function deleteAlertsButch(ids: string[]) {
  try {
    const kv = await Deno.openKv();
    let counter = 0;
    for (const id in ids) {
      await kv.delete(["Alerts", id]);
      counter++;
    }

    await kv.close();
    return `Deleted ${counter} Alerts`;
  } catch (e) {
    console.log(e);
  }
}
