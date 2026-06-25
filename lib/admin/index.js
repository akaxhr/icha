import { isAdminAllowed } from "./auth.js";
import { handleChatAdmin } from "./chat.js";
import { handleMessagesAdmin } from "./messages.js";
import { handleGroupSettingsAdmin } from "./groupSettings.js";
import { handlePanelVisitAdmin } from "./panelVisit.js";

export function getAdminAction(req) {
  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/api/webhook", `https://${host}`);

  return url.searchParams.get("admin") || url.searchParams.get("action") || null;
}

export async function handleAdminApi(req, res, action) {
  if (!isAdminAllowed(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (action === "chat") return handleChatAdmin(req, res);
  if (action === "messages") return handleMessagesAdmin(req, res);
  if (action === "group-settings") return handleGroupSettingsAdmin(req, res);
  if (action === "panel-visit") return handlePanelVisitAdmin(req, res);

  return res.status(404).json({ error: "Unknown admin action" });
}
