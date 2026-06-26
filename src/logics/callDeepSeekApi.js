const { Config, Const } = require("#config");
const { FlomMessage } = require("#models");
const { encode } = require("gpt-3-encoder");

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/anthropic/v1/messages";
const DEEPSEEK_MODEL = "deepseek-v4-flash"; // most capable; swap to deepseek-v4-flash to cut cost

const WEB_SEARCH_TOOL = {
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 1,
};

async function callDeepSeekApi(textMessage, senderPhoneNumber, receiverPhoneNumber, isFatAi) {
  let systemMessage = "";
  if (isFatAi) {
    systemMessage = Const.FatAiSystemMessage;
  } else {
    systemMessage = Const.FlomTeamSystemMessage;
  }

  // Append search directive so the model doesn't answer from stale memory
  systemMessage +=
    "\n\nYou have a web_search tool. Your training knowledge has a cutoff date, so you " +
    "must NOT answer from memory for anything involving recent events, current prices, " +
    "software versions, or anything described as 'latest' or 'current'. For those, " +
    "ALWAYS search first and base your answer only on the results. " +
    "Do not mention a knowledge cutoff — search instead.";

  console.log("Calling DeepSeek API");
  let messages = [];

  if (isFatAi) {
    var oldMessages = await FlomMessage.find({
      $or: [
        { receiverPhoneNumber: receiverPhoneNumber, senderPhoneNumber: senderPhoneNumber },
        { receiverPhoneNumber: senderPhoneNumber, senderPhoneNumber: receiverPhoneNumber },
      ],
    })
      .sort({ created: -1 })
      .limit(10)
      .lean();

    oldMessages = oldMessages.reverse();

    var oldMessagesString = "";
    oldMessages.forEach(function (oldMess) {
      oldMessagesString += oldMess.message + " ";
    });

    var encoded = encode(oldMessagesString);
    while (encoded.length >= 1000) {
      oldMessages = oldMessages.slice(1);
      oldMessagesString = "";
      oldMessages.forEach(function (oldMess) {
        oldMessagesString += oldMess.message + " ";
      });
      encoded = encode(oldMessagesString);
    }

    var oldMessagesTransformed = oldMessages.map((message) => {
      if (message.receiverPhoneNumber === "+2340000000000") {
        return { role: "user", content: message.message };
      } else {
        return { role: "assistant", content: message.message };
      }
    });

    messages = [...oldMessagesTransformed, { role: "user", content: textMessage }];
  } else {
    messages = [{ role: "user", content: textMessage }];
  }

  const body = {
    model: DEEPSEEK_MODEL,
    max_tokens: Const.FatAiMaxTokens,
    system: systemMessage,
    messages,
    tools: [WEB_SEARCH_TOOL],
  };

  const shouldSearch = await needsWebSearch(textMessage);
  if (!shouldSearch) delete body.tools; // let the model decide to search if it wants to

  const res = await fetch(DEEPSEEK_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": Config.chatGPTApiKey, // point this env var at your DeepSeek key
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();

  // Extract only the text blocks (search result blocks are separate)
  const responseText = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join(" ");

  // completion_tokens sits under usage.output_tokens in the Anthropic-format response
  const tokenUsage = data.usage?.output_tokens ?? 0;

  console.log("DeepSeek API usage:", data.usage);

  return {
    tokenUsage,
    message: responseText,
  };
}

async function needsWebSearch(textMessage) {
  try {
    const res = await fetch("https://api.deepseek.com/anthropic/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": Config.chatGPTApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        max_tokens: 10,
        system:
          "You decide if a question requires a web search for current, real-time, or recent information to answer accurately. Reply with only 'yes' or 'no'.",
        messages: [{ role: "user", content: textMessage }],
      }),
    });

    if (!res.ok) return false; // fail open: skip search if preflight errors
    const data = await res.json();
    const answer = data.content
      .find((b) => b.type === "text")
      ?.text?.trim()
      .toLowerCase();
    return answer === "yes";
  } catch (error) {
    console.error("needsWebSearch, Error checking if web search is needed:", error);
    return false; // fail open: skip search if preflight errors
  }
}

module.exports = callDeepSeekApi;
