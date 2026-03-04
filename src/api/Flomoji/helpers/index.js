"use strict";

const { Config } = require("#config");

const addFlomojiLinks = (flomoji) => {
  if (!flomoji) return {};

  flomoji.link = `${Config.webClientUrl}/uploads/flomojis/${flomoji.emoji.nameOnServer}`;
  flomoji.smallEmojiLink = `${Config.webClientUrl}/uploads/flomojis/${flomoji.smallEmoji.nameOnServer}`;

  return flomoji;
};

module.exports = { addFlomojiLinks };
