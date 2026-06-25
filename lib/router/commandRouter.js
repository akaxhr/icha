const commands = new Map();

export function registerCommand(name, handler) {
  commands.set(name.toLowerCase(), handler);
}

export async function handleCommand(ctx) {
  const text = ctx.message?.text;
  if (!text || !text.startsWith("/")) return false;

  const [cmd] = text.split(" ");
  const clean = cmd.split("@")[0].slice(1).toLowerCase();

  const handler = commands.get(clean);
  if (!handler) return false;

  await handler(ctx);
  return true;
}
