const { Config, Const } = require("#config");
const { FlomMessage } = require("#models");
const { encode } = require("gpt-3-encoder");

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/anthropic/v1/messages";
const DEEPSEEK_MODEL = "deepseek-v4-flash";
const d = new Date();
const TODAY = d.toISOString().slice(0, 10);
const YEAR = d.getFullYear();

const WEB_SEARCH_TOOL = {
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 3,
};

const SEARCH_REGEX =
  /\b(latest|current|today|tonight|yesterday|last \d+|last few|last several|last week|last month|last year|this week|this month|this year|right now|at the moment|as of|up to date|recent|recently|real.?time|breaking|just (announced|released|happened)|exchange rate|stock price|crypto|bitcoin|ethereum|weather|forecast|match score|sports result|league standings|who is|who are|who was|who won|who lost|who leads|who owns|who runs|when did|when is|when was|when will|what is the (current|latest|new|recent)|what happened|what's (new|happening|going on)|is .{1,30} still (open|alive|available|active|running|working)|does .{1,30} still (exist|work|operate)|has .{1,30} (changed|updated|released)|new (version|update|release)|just (out|dropped|launched)|election result|war update|merger|acquired|acquisition|arrested|died|passed away)\b/i;

function needsSearch(text) {
  try {
    if (SEARCH_REGEX.test(text)) return true;
    const yearMatch = text.match(/\b(2\d{3})\b/g);
    if (yearMatch) {
      return yearMatch.some((y) => {
        const n = parseInt(y);
        return n > 2023 && n <= YEAR + 4;
      });
    }
    return false;
  } catch (error) {
    console.error("Error in needsSearch:", error);
    return false;
  }
}

async function callDeepSeekApi(textMessage, senderPhoneNumber, receiverPhoneNumber, isFatAi) {
  try {
    let systemMessage = "";
    if (isFatAi) {
      systemMessage = Const.FatAiSystemMessage;
    } else {
      systemMessage = Const.FlomTeamSystemMessage;
    }

    systemMessage +=
      `\n\nToday's date is ${TODAY}. You have a web_search tool. Your training knowledge has a cutoff date, so you ` +
      "must NOT answer from memory for anything involving recent events, current prices, " +
      "software versions, scores, or anything described as 'latest' or 'current'. For those, " +
      "search first and base your answer only on the results. " +
      "Search ONCE per topic then answer immediately using what you found. " +
      "If results are incomplete, answer with what you have and say so — " +
      "never invent or estimate scores, prices, or factual data not present in search results. " +
      "Do not mention a knowledge cutoff — search instead.";

    console.log("Calling DeepSeek API");
    let messages = [],
      contextNeedsSearch = false;

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

      // Also check last assistant message for search context (e.g. follow-up questions)
      const lastAssistantMessage =
        oldMessagesTransformed.filter((m) => m.role === "assistant").slice(-1)[0]?.content || "";

      messages = [...oldMessagesTransformed, { role: "user", content: textMessage }];

      // Use search if current message OR recent context is time-sensitive
      contextNeedsSearch = needsSearch(textMessage) || needsSearch(lastAssistantMessage);
    } else {
      messages = [{ role: "user", content: textMessage }];
      contextNeedsSearch = needsSearch(textMessage);
    }

    console.log("Web search:", contextNeedsSearch);

    const body = {
      model: DEEPSEEK_MODEL,
      max_tokens: Const.FatAiMaxTokens,
      system: systemMessage,
      messages,
      ...(contextNeedsSearch && { tools: [WEB_SEARCH_TOOL] }),
    };

    const res = await fetch(DEEPSEEK_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": Config.chatGPTApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`DeepSeek API ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    console.log("DeepSeek API usage:", data.usage);

    // Extract text blocks and strip any leaked DSML tool call syntax
    const rawText = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join(" ");

    const message = rawText.replace(/<｜｜DSML｜｜[\s\S]*/u, "").trim();

    if (!message) {
      return {
        tokenUsage: data.usage?.output_tokens ?? 0,
        message: "I wasn't able to find that information. Please try asking again.",
      };
    }

    return {
      tokenUsage: data.usage?.output_tokens ?? 0,
      message,
    };
  } catch (error) {
    console.error("Error calling DeepSeek API:", error);
    return {
      tokenUsage: 0,
      message: "There was an error processing your request. Please try again later.",
    };
  }
}

module.exports = callDeepSeekApi;
