// deno-lint-ignore-file no-explicit-any
export function splitArrayIntoChunks(array: any[], chunksNumber: number) {
  const chunkSize = Math.ceil(array.length / chunksNumber); // Calculate chunk size (rounded up)
  const result: any[] = Array.from({ length: chunksNumber }, () => {
    return [];
  }); // Create empty array of 5 arrays

  for (let i = 0, j = 0; i < array.length; i += chunkSize, j++) {
    result[j].push(...array.slice(i, i + chunkSize)); // Push elements to each chunk
  }

  return result;
}
