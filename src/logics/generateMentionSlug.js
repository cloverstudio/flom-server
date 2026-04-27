"use strict";

const { User } = require("#models");

async function generateMentionSlug(userName) {
  if (!userName) return null;

  const baseSlug = userName.replace(/\s+/g, "_").toLowerCase(); // Replace spaces with underscores and limit length
  let mentionSlug = baseSlug;
  let suffix = 1;

  while (
    await User.exists({
      $or: [{ "whatsApp.mentionSlug": mentionSlug }, { "whatsApp.oldMentionSlug": mentionSlug }],
    })
  ) {
    mentionSlug = `${baseSlug}${suffix}`;
    suffix++;
  }

  return mentionSlug;
}

module.exports = generateMentionSlug;
