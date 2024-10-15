export async function deleteAllAlertObjs(prefix: string) {
  try {
    let counter = 0;
    const kv = await Deno.openKv();
    const prefixKey = [prefix];
    const iter = kv.list({ prefix: prefixKey });
    for await (const entry of iter) {
      await kv.delete(entry.key);
      counter++;
    }
    await kv.close(); // Close the KV connection

    const msg = `${prefix}: deleted ${counter} object(s)`;
    console.log(msg);
    return msg;
  } catch (e) {
    console.log(e);
  }
}
