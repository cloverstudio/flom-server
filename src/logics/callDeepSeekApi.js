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

  const shouldSearch = await needsSearch(textMessage);
  console.log("needsSearch result:", shouldSearch);
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

const SEARCH_REGEX =
  /\b(latest|current|today|tonight|yesterday|this week|this month|this year|right now|at the moment|as of|up to date|recent|recently|now|live|real.?time|breaking|just (announced|released|happened)|price|cost|how much|rate|exchange rate|stock|market|crypto|bitcoin|ethereum|weather|forecast|score|result|standings|who is|who are|who was|who won|who lost|who leads|who owns|who runs|when did|when is|when was|when will|what is the (current|latest|new|recent)|what happened|what's (new|happening|going on)|where is|is .{1,30} still|does .{1,30} still|has .{1,30} (changed|updated|released)|new (version|update|release|model|law|policy|rule)|announcement|launched|just (out|dropped|launched)|election|war|conflict|crisis|deal|merger|acquired|acquisition|arrested|died|death|passed away|202[4-9]|20[3-9]\d|209\d)\b/i;

const YEAR_RANGE_REGEX = /\b(20[3-9]\d|209\d|20[2-9][4-9]|2[1-9]\d{2})\b/;

function needsSearch(text) {
  try {
    if (SEARCH_REGEX.test(text)) return true;

    const yearMatch = text.match(/\b(2\d{3})\b/g);
    if (yearMatch) {
      return yearMatch.some((y) => {
        const n = parseInt(y);
        return n > 2023 && n < 2100;
      });
    }

    return false;
  } catch (error) {
    console.error("Error in needsSearch:", error);
    return false;
  }
}

module.exports = callDeepSeekApi;
