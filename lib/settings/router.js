import { handleSettingsClose, handleSettingsRefresh } from "./groups.js";
import { handleSettingsGroup } from "./home.js";
import { handleSettingsPage } from "./page.js";
import { handleSettingsToggle } from "./toggle.js";
import { handleCommandPermissionCallback } from "../commandPermissions/callbacks.js";

export async function handleSettingsCallback(callbackQuery) {
  const data = callbackQuery.data || "";

  if (!data.startsWith("settings:")) return false;

  if (data === "settings:close") return handleSettingsClose(callbackQuery);
  if (data === "settings:refresh") return handleSettingsRefresh(callbackQuery);
  if (data.startsWith("settings:group:")) return handleSettingsGroup(callbackQuery);
  if (data.startsWith("settings:page:")) return handleSettingsPage(callbackQuery);
  if (data.startsWith("settings:toggle:")) return handleSettingsToggle(callbackQuery);

  if (data.startsWith("settings:rules:")) {
    const [, , groupId] = data.split(":");
    const { handleRulesPage } = await import("./pages/rules.js");
    return handleRulesPage(callbackQuery, groupId);
  }

  if (data.startsWith("cmdperm:")) {
  return handleCommandPermissionCallback(callbackQuery);
}

  return false;
}
