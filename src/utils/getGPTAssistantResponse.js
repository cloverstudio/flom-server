const { Config } = require("#config");
const { User } = require("#models");

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: Config.chatGPTApiKey,
});
const openai = new OpenAIApi(configuration);

async function getGPTAssistantResponse(assistantId, userId, messageText) {
  const user = await User.findOne({ _id: userId }).lean();

  let thread;

  //Check if user already communicated with Assistant and has threadId
  if (user?.flomTeamThreadId) {
    thread = await openai.beta.threads.retrieve(user.flomTeamThreadId);
    await openai.beta.threads.messages.create(user.flomTeamThreadId, {
      role: "user",
      content: messageText,
    });
  } else {
    thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: messageText,
        },
      ],
    });
    await User.updateOne({ _id: userId }, { flomTeamThreadId: thread.id });
  }

  const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: assistantId,
  });

  console.log("Calling Assistant meessage list");
  const messages = await openai.beta.threads.messages.list(thread.id, {
    run_id: run.id,
  });

  const message = messages.data.pop();
  if (message.content[0].type === "text") {
    const { text } = message.content[0];
    const { annotations } = text;
    const citations = [];

    let index = 0;
    for (let annotation of annotations) {
      text.value = text.value.replace(annotation.text, "[" + index + "]");
      const { file_citation } = annotation;
      if (file_citation) {
        const citedFile = await openai.files.retrieve(file_citation.file_id);
        citations.push("[" + index + "]" + citedFile.filename);
      }
      index++;
    }

    openai.beta.threads.messages.create(user.flomTeamThreadId, {
      role: "assistant",
      content: text.value,
    });

    return text.value.replace(/\[\d+\]|[#*]/g, "");
  }
}

module.exports = getGPTAssistantResponse;
