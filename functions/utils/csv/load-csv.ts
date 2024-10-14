import { readCSVObjects } from "https://deno.land/x/csv@v0.9.2/mod.ts";

export async function loadCSV(filePath: string) {
  try {
    let array = [];
    const options = {
      lineSeparator: "\r",
    };
    const f = await Deno.open(filePath);
    for await (const obj of readCSVObjects(f)) {
      array.push(obj);
    }
    array = array.map((a) => cleanObject(a));
    f.close();
    return array;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

function cleanObject(obj: Record<string, string>): Record<string, string> {
  const newObj = {} as Record<string, string>;
  for (const [key, value] of Object.entries(obj)) {
    newObj[key.replace(/\r$/g, "").trim()] = value.replace(/\r$/g, "").trim();
  }
  return newObj;
}
