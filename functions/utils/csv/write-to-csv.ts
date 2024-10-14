// deno-lint-ignore-file no-explicit-any
import { writeCSVObjects } from "https://deno.land/x/csv@v0.9.2/mod.ts";

async function writeToCSV(filePath: string, array: any[]) {
  if (array.length == 0 || array == undefined) {
    throw Error("Array is not valid.");
  }
  const file = await Deno.open(filePath, {
    write: true,
    create: true,
    truncate: true,
  });
  const header = Object.keys(array[0]);
  const asyncObjectsGenerator = createObjectIterator(array);

  await writeCSVObjects(file, asyncObjectsGenerator(), { header });

  file.close();
}

function createObjectIterator(array: any[]) {
  return function* getObjectsGenerator() {
    for (let i = 0; i < array.length; i++) {
      yield array[i];
    }
  };
}

export default writeToCSV;
