const { Config, Const, countries } = require("#config");
const { FlomMessage, User } = require("#models");

const { OpenAI } = require("openai");
const openai = new OpenAI({ baseURL: "https://api.deepseek.com", apiKey: Config.chatGPTApiKey });
const { encode } = require("gpt-3-encoder");

const DEEPSEEK_MODEL = "deepseek-v4-flash";
const d = new Date();
const TODAY = d.toISOString().slice(0, 10);
const YEAR = d.getFullYear();

const tools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for current information, news, or facts not in your training data.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
        },
        required: ["query"],
      },
    },
  },
];

async function callDeepSeekApiV2(textMessage, senderPhoneNumber, receiverPhoneNumber, isFatAi) {
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
    "Do not mention a knowledge cutoff — search instead." +
    "Do not use markdown formatting. No tables, no ** bold **, no * italics *. Plain text only.";

  console.log("Calling DeepSeek API");
  let messagesBase = [],
    messages = [];

  const senderUser = await User.findOne(
    { phoneNumber: senderPhoneNumber },
    { countryCode: 1 },
  ).lean();

  let language = "en";
  if (senderUser && senderUser.countryCode) {
    const country = countries[senderUser.countryCode];
    if (country && country.languages && country.languages.length > 0) {
      language = country.languages[0];
    }
  }

  if (isFatAi) {
    //fetch old messages before openai call
    const oldMessages = await getOldMessages({ senderPhoneNumber, receiverPhoneNumber });
    messagesBase = oldMessages;

    messages = [{ role: "system", content: systemMessage }, ...oldMessages];

    //push new question
    messages.push({ role: "user", content: textMessage });
    messagesBase.push({ role: "user", content: textMessage });
  } else {
    messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: textMessage },
    ];
  }

  const completion = await openai.chat.completions.create({
    model: DEEPSEEK_MODEL,
    messages,
    max_tokens: Const.FatAiMaxTokens,
    temperature: 0.3,
    tools: tools,
    tool_choice: "auto",
  });

  const message = completion.choices[0].message;
  const tokenUsage = completion.usage.completion_tokens;

  console.log("Initial DeepSeek API response:", message);

  delete message.reasoning_content; // Remove reasoning content to reduce token usage

  if (message.tool_calls) {
    for (const toolCall of message.tool_calls) {
      if (toolCall.function.name === "web_search") {
        const args = JSON.parse(toolCall.function.arguments);
        console.log("Performing web search with query:", args.query);
        const result = await webSearch(args.query, language);
        console.log("Web search result:", result);

        // Append the tool call and its result to the conversation
        messagesBase.push(message);
        messagesBase.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });

        messagesBase.push({
          role: "system",
          content:
            "You have no tools available. " +
            "Answer the user's question directly using only the search results already provided above. " +
            "Do not attempt to call any function or tool. " +
            "Do not use markdown formatting. No tables, no ** bold **, no * italics *. Plain text only.",
        });
      }
    }

    // Send the conversation back to the model with the tool result included
    const followUp = await openai.chat.completions.create({
      model: DEEPSEEK_MODEL,
      messages: messagesBase,
      max_tokens: Const.FatAiMaxTokens,
      temperature: 0.3,
    });

    const followUpMessage = followUp.choices[0].message;
    const followUpTokenUsage = followUp.usage.completion_tokens;

    console.log("Followup DeepSeek API response:", followUpMessage);

    if (followUpMessage.content.includes("｜DSML｜")) {
      followUpMessage.content =
        "Sorry, I was not able to find that information. Please try asking again. Perhaps try rephrasing your question or providing more context.";
    }

    return {
      tokenUsage: tokenUsage + followUpTokenUsage,
      message: followUpMessage.content,
    };
  }
}

async function getOldMessages({ senderPhoneNumber, receiverPhoneNumber }) {
  try {
    let oldMessages = await FlomMessage.find({
      $or: [
        { receiverPhoneNumber: receiverPhoneNumber, senderPhoneNumber: senderPhoneNumber },
        { receiverPhoneNumber: senderPhoneNumber, senderPhoneNumber: receiverPhoneNumber },
      ],
    })
      .sort({ created: -1 })
      .limit(10)
      .lean();

    oldMessages = oldMessages.reverse();

    let oldMessagesString = "";

    oldMessages.forEach(function (oldMess) {
      oldMessagesString += oldMess.message + " ";
    });

    let encoded = encode(oldMessagesString);
    while (encoded.length >= 1000) {
      oldMessages = oldMessages.slice(1);
      oldMessagesString = "";
      oldMessages.forEach(function (oldMess) {
        oldMessagesString += oldMess.message + " ";
      });
      encoded = encode(oldMessagesString);
    }

    let oldMessagesTransformed = oldMessages.map((message) => {
      if (message.receiverPhoneNumber === "+2340000000000") {
        return { role: "user", content: message.message };
      } else {
        return { role: "assistant", content: message.message };
      }
    });

    return oldMessagesTransformed;
  } catch (error) {
    console.error("callDeepSeekApiV2, error fetching old messages:", error);
    return [];
  }
}

async function webSearch(query, language = "en") {
  try {
    const url = `${Config.webSearchUrl}/search?q=${encodeURIComponent(
      query,
    )}&format=json&language=${language}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!response.ok) {
      throw new Error(`SearXNG returned ${response.status}`);
    }

    const data = await response.json();

    // Trim it down to what's useful for the LLM, raw SearXNG output is verbose
    const results = data.results.slice(0, 10).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
    }));

    if (language !== "en" && results.length < 2) {
      // If not enough results, try again in English
      return await webSearch(query, "en");
    }

    return JSON.stringify({ query, results });
  } catch (error) {
    console.error("Error during web search:", error);
    return JSON.stringify({ query, results: [] });
  }
}

module.exports = callDeepSeekApiV2;
