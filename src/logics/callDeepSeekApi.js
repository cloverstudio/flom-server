const { Config, Const } = require("#config");
const { FlomMessage } = require("#models");
const { encode } = require("gpt-3-encoder");

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-v4-flash";

const d = new Date();
const TODAY = d.toISOString().slice(0, 10);
const YEAR = d.getFullYear();

const SEARCH_TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for current information. Use for anything recent or time-sensitive.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
        },
        required: ["query"],
      },
    },
  },
];

const SEARCH_REGEX =
  /\b(latest|current|today|tonight|yesterday|this week|this month|this year|last week|last month|last year|right now|at the moment|as of|up to date|recent|recently|real.?time|breaking|just (announced|released|happened)|exchange rate|stock price|crypto|bitcoin|ethereum|weather|forecast|match score|sports result|league standings|who is|who are|who was|who won|who lost|who leads|who owns|who runs|when did|when is|when was|when will|what is the (current|latest|new|recent)|what happened|what's (new|happening|going on)|is .{1,30} still (open|alive|available|active|running|working)|does .{1,30} still (exist|work|operate)|has .{1,30} (changed|updated|released)|new (version|update|release)|just (out|dropped|launched)|election result|war update|merger|acquired|acquisition|arrested|died|passed away)\b/i;

function yearNeedsSearch(text) {
  try {
    const years = text.match(/\b(2\d{3})\b/g);

    if (!years) return false;

    return years.some((y) => {
      const n = parseInt(y);
      return n > 2023 && n <= YEAR + 1;
    });
  } catch (e) {
    console.error("Error in yearNeedsSearch:", e);
    return false;
  }
}

function needsSearch(text) {
  return SEARCH_REGEX.test(text) || yearNeedsSearch(text);
}

async function runWebSearch(query) {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: Config.tavilyApiKey,
        query,
        max_results: 3,
        include_answer: true,
      }),
    });
    if (!res.ok) return `Search failed: ${res.status}`;
    const data = await res.json();
    const hits = (data.results || []).map((r) => `- ${r.title}: ${r.content}`).join("\n");
    return [data.answer, hits].filter(Boolean).join("\n");
  } catch (error) {
    console.error("Error in runWebSearch:", error);
    return "Search failed due to an internal error.";
  }
}

async function callDeepSeek(messages, useSearch) {
  try {
    const body = {
      model: DEEPSEEK_MODEL,
      messages,
      max_tokens: Const.FatAiMaxTokens,
    };
    if (useSearch) body.tools = SEARCH_TOOLS;

    const res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${Config.chatGPTApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`DeepSeek API ${res.status}: ${await res.text()}`);
    return res.json();
  } catch (error) {
    console.error("Error in callDeepSeek:", error);
    throw new Error("DeepSeek API call failed due to an internal error.");
  }
}

async function callChatGPTApi(textMessage, senderPhoneNumber, receiverPhoneNumber, isFatAi) {
  try {
    let systemMessage = "";
    if (isFatAi) {
      systemMessage = Const.FatAiSystemMessage;
    } else {
      systemMessage = Const.FlomTeamSystemMessage;
    }

    systemMessage +=
      `\n\nToday's date is ${TODAY}.` +
      "You have a web_search function. You must NOT answer from memory for anything " +
      "involving recent events, current prices, software versions, or anything described " +
      "as 'latest' or 'current'. For those, call web_search and base your answer only on " +
      "the results. For settled facts or the current date, answer directly.";

    console.log("Calling DeepSeek API");

    let messages = [{ role: "system", content: systemMessage }];

    if (isFatAi) {
      var oldMessages = await FlomMessage.find({
        $or: [
          { receiverPhoneNumber: receiverPhoneNumber, senderPhoneNumber: senderPhoneNumber },
          { receiverPhoneNumber: senderPhoneNumber, senderPhoneNumber: receiverPhoneNumber },
        ],
      })
        .sort({ created: -1 })
        .limit(20)
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

      messages = [...messages, ...oldMessagesTransformed];
    }

    messages.push({ role: "user", content: textMessage });

    const useSearch = needsSearch(textMessage);
    console.log(`Web search: ${useSearch}`);

    // Tool loop — max 3 search turns
    for (let turn = 0; turn < 3; turn++) {
      const data = await callDeepSeek(messages, useSearch);
      const msg = data.choices[0].message;

      console.log("DeepSeek API usage:", data.usage);

      if (msg.tool_calls && msg.tool_calls.length) {
        // Push full message object to preserve reasoning_content for DeepSeek
        messages.push(msg);

        for (const tc of msg.tool_calls) {
          let query = null;
          try {
            query = JSON.parse(tc.function.arguments).query;
          } catch {
            // malformed JSON from model
          }
          console.log(`Searching: ${query}`);
          const result = query ? await runWebSearch(query) : "No valid query provided.";
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result,
          });
        }
        continue;
      }

      return {
        tokenUsage: data.usage?.completion_tokens ?? 0,
        message: msg.content,
      };
    }

    return {
      tokenUsage: 0,
      message: "Sorry, I was unable to complete that request. Please try again.",
    };
  } catch (error) {
    console.error("Error in callChatGPTApi:", error);
    return {
      tokenUsage: 0,
      message:
        "Sorry, I was unable to complete that request due to an internal error. Please try again.",
    };
  }
}

module.exports = callChatGPTApi;
