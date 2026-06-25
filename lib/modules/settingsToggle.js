import { getFullGroupSettings, saveFullGroupSettings } from "../groupStore.js";

const PAGE_TO_SETTING = {
  rules: "rules_enabled",
  spam: "spam_enabled",
  welcome: "welcome_enabled",
  flood: "flood_enabled",
  captcha: "captcha_enabled",
  ai: "ai_enabled",
  warns: "warns_enabled",
  links: "links_enabled",
  delete: "delete_enabled"
};

export function getSettingKey(page) {
  return PAGE_TO_SETTING[page] || `${page}_enabled`;
}

export async function toggleSetting(groupId, page, value) {
  const key = getSettingKey(page);

  const settings = await saveFullGroupSettings(groupId, {
    [key]: value === "on"
  });

  return {
    key,
    value: value === "on",
    settings
  };
}

export async function getPageStatus(groupId, page) {
  const key = getSettingKey(page);
  const settings = await getFullGroupSettings(groupId);

  return {
    key,
    value: Boolean(settings?.[key])
  };
}
