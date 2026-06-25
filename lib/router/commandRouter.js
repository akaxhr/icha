const commands = new Map();

export function registerCommand(command, handler) {
  commands.set(command.toLowerCase(), handler);
}

export async function handleCommands(ctx) {
  if (!ctx.text || !ctx.text.startsWith("/")) return false;

  const command = ctx.text.split(" ")[0].split("@")[0].toLowerCase();
  const handler = commands.get(command);

  if (!handler) return false;

  await handler(ctx);
  return true;
}
