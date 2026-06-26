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
    .map((cmd) => {
      const current = permissions[cmd] || DEFAULT_COMMAND_PERMISSIONS[cmd];
      return `• <code>/${cmd}</code> » ${PERMISSIONS[current]} ${permissionName(current)}`;
    })
    .join("\n");

  return `🕹 <b>Commands Permissions</b>
From this menu you can configure the usage permissions of the following commands.

❌ = nobody  |  👥 = all
🤖 = all, in private chat
👮 = admins and moderators

${lines}`;
}

function permissionButton(groupId, cmd, permission, current) {
  const selected = current === permission;

  return {
    text: PERMISSIONS[permission],
    callback_data: `cmdperm:${groupId}:${cmd}:${permission}`,
    style: selected ? "success" : undefined
  };
}

export async function buildCommandPermissionsKeyboard(groupId) {
  const permissions = await getAllCommandPermissions(groupId);

  const rows = Object.keys(DEFAULT_COMMAND_PERMISSIONS).map((cmd) => {
    const current = permissions[cmd] || DEFAULT_COMMAND_PERMISSIONS[cmd];

    return [
      {
        text: COMMAND_LABELS[cmd] || `/${cmd}`,
        callback_data: "cmdperm:noop",
        style: "primary"
      },
      permissionButton(groupId, cmd, "none", current),
      permissionButton(groupId, cmd, "staff", current),
      permissionButton(groupId, cmd, "all", current),
      permissionButton(groupId, cmd, "private", current)
    ];
  });

  rows.push([
    {
      text: "Back",
      callback_data: `settings:page:${groupId}:rules`,
      style: "primary"
    }
  ]);

  return { inline_keyboard: rows };
}
