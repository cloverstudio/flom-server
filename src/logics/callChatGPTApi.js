const { Config, Const } = require("#config");
const { FlomMessage } = require("#models");

const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: Config.chatGPTApiKey });
const { encode } = require("gpt-3-encoder");

async function callChatGPTApi(textMessage, senderPhoneNumber, receiverPhoneNumber, isFatAi) {
  let systemMessage = "";
  if (isFatAi) {
    systemMessage = Const.FatAiSystemMessage;
  } else {
    systemMessage = Const.FlomTeamSystemMessage;
  }

  console.log("Calling ChatGPT API");
  let messages = [];

  if (isFatAi) {
    //fetch old messages before openai call

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

    messages = [{ role: "system", content: systemMessage }, ...oldMessagesTransformed];

    //push new question
    messages.push({ role: "user", content: textMessage });
  } else {
    messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: textMessage },
    ];
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens: Const.FatAiMaxTokens,
    temperature: 0.7,
  });
  return {
    tokenUsage: completion.usage.completion_tokens,
    message: completion.choices[0].message.content,
  };
}

module.exports = callChatGPTApi;
