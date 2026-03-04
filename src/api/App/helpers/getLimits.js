const { Config } = require("#config");
const { BalanceEmoji } = require("#models");

async function getLimits() {
  const balanceEmojiList = await BalanceEmoji.find({}).sort({ limit: 1 }).lean();

  if (!balanceEmojiList || balanceEmojiList.length === 0) return [];

  const limits = balanceEmojiList.map((balanceEmoji, index) => {
    return {
      lowerLimit: balanceEmoji.limit,
      upperLimit: balanceEmojiList[index + 1]?.limit ?? Number.MAX_SAFE_INTEGER,
      emojiLink: `${Config.webClientUrl}/uploads/balance-emojis/${balanceEmoji.emoji.nameOnServer}`,
    };
  });

  return limits;
}

module.exports = { getLimits };
