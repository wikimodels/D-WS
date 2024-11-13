export async function printInline(
  message: string,
  colorFunction: (text: string) => string = (text) => text
): Promise<void> {
  const colorizedMessage = colorFunction(message);
  await Deno.stdout.write(new TextEncoder().encode(`${colorizedMessage}\r`));
}
