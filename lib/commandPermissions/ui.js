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
  if (permission === "none") return "Nobody";
  if (permission === "all") return "Everyone";
  if (permission === "private") return "Private";
  if (permission === "staff") return "Staff";
  return permission;
}

export async function buildCommandPermissionsText(groupId) {
  const permissions = await getAllCommandPermissions(groupId);

  const lines = Object.keys(DEFAULT_COMMAND_PERMISSIONS)
    .map((cmd) => {
      const p = permissions[cmd] || DEFAULT_COMMAND_PERMISSIONS[cmd];
      return `• <code>/${cmd}</code> » ${PERMISSIONS[p]} ${permissionName(p)}`;
    })
    .join("\n");

  return `🕹 <b>Commands Permissions</b>
From this menu you can configure the usage permissions of the following commands.

❌ = nobody  |  👥 = all
🤖 = all, in private chat
👮 = admins and moderators

${lines}`;
}

function cell(groupId, cmd, permission, selected) {
  return {
    text: selected ? PERMISSIONS[permission] : "×",
    callback_data: `cmdperm:${groupId}:${cmd}:${permission}`
  };
}

export async function buildCommandPermissionsKeyboard(groupId) {
  const permissions = await getAllCommandPermissions(groupId);

  const rows = Object.keys(DEFAULT_COMMAND_PERMISSIONS).map((cmd) => {
    const current = permissions[cmd] || DEFAULT_COMMAND_PERMISSIONS[cmd];

    return [
      { text: COMMAND_LABELS[cmd] || `/${cmd}`, callback_data: "cmdperm:noop" },
      cell(groupId, cmd, "none", current === "none"),
      cell(groupId, cmd, "staff", current === "staff"),
      cell(groupId, cmd, "all", current === "all"),
      cell(groupId, cmd, "private", current === "private")
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
