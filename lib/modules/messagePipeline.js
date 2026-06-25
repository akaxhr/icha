import {
  handleAutoFilter,
  handleGroupCommand,
  handleJoinLeave,
  handleVerify
} from "../groupFeatures.js";

import {
  applyViolation,
  checkLocksAndSpam,
  handleModerationCommand
} from "../moderation.js";

import { maybeAiModerate } from "../aiModeration.js";

export async function runMessagePipeline(ctx) {
  const { message, settings } = ctx;

  if (await handleJoinLeave(message)) {
    return true;
  }

  if (await handleVerify(message)) {
    return true;
  }

  if (await handleModerationCommand(message)) {
    return true;
  }

  if (await handleGroupCommand(message)) {
    return true;
  }

  const violation = await checkLocksAndSpam(message, settings);

  if (violation) {
    await applyViolation(message, violation);
    return true;
  }

  if (await maybeAiModerate(message, settings)) {
    return true;
  }

  if (await handleAutoFilter(message)) {
    return true;
  }

  return false;
}
