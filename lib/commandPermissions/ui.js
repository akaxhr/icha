import {
  DEFAULT_COMMAND_PERMISSIONS,
  PERMISSIONS,
  getAllCommandPermissions
} from "./storage.js";

export const COMMAND_LABELS = {
  staff: "/staff",
  rules: "/rules",
  me: "/me",
  translate: "/translate",
  link: "/link"
};

export function permissionName(permission) {
  if (permission === "none") return "nobody";
  if (permission === "all") return "all";
  if (permission === "private") return "all, in private chat";
  if (permission === "staff") return "admins and moderators";
  return permission;
}

export async function buildCommandPermissionsText(groupId) {
  const permissions = await getAllCommandPermissions(groupId);

  const lines = Object.keys(DEFAULT_COMMAND_PERMISSIONS)
    .map((cmd) => `• <code>/${cmd}</code> » ${PERMISSIONS[permissions[cmd]]} ${permissionName(permissions[cmd])}`)
    .join("\n");

  return `🕹 <b>Commands Permissions</b>
From this menu you can configure the usage permissions of the following commands.

❌ = nobody  |  👥 = all
🤖 = all, in private chat
👮 = admins and moderators

${lines}`;
}

export async function buildCommandPermissionsKeyboard(groupId) {
  const permissions = await getAllCommandPermissions(groupId);

  const rows = Object.keys(DEFAULT_COMMAND_PERMISSIONS).map((cmd) => {
    return [
      { text: COMMAND_LABELS[cmd] || `/${cmd}`, callback_data: `cmdperm:noop` },
      {
        text: permissions[cmd] === "none" ? "❌" : "×",
        callback_data: `cmdperm:${groupId}:${cmd}:none`
      },
      {
        text: permissions[cmd] === "staff" ? "👮" : "👮",
        callback_data: `cmdperm:${groupId}:${cmd}:staff`
      },
      {
        text: permissions[cmd] === "all" ? "👥" : "👥",
        callback_data: `cmdperm:${groupId}:${cmd}:all`
      },
      {
        text: permissions[cmd] === "private" ? "🤖" : "🤖",
        callback_data: `cmdperm:${groupId}:${cmd}:private`
      }
    ];
  });

  rows.push([
    {
      text: "Back",
      callback_data: `settings:page:${groupId}:rules`
    }
  ]);

  return { inline_keyboard: rows };
}
