const callbacks = new Map();

export function registerCallback(prefix, handler) {
  callbacks.set(prefix, handler);
}

export async function handleCallback(ctx) {
  const data = ctx.callbackQuery?.data;
  if (!data) return false;

  for (const [prefix, handler] of callbacks.entries()) {
    if (data.startsWith(prefix)) {
      await handler(ctx);
      return true;
    }
  }

  return false;
}
