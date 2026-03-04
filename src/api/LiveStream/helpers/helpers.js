const { Config, countries } = require("#config");
const Utils = require("#utils");
const { formatLiveStreamResponse } = require("#logics");

const languages = [];

async function isLanguageValid(language) {
  if (languages.length === 0) {
    for (const countryCode in countries) {
      const country = countries[countryCode];
      languages.push(...country.languages);
    }
  }

  if (!language) return false;

  return languages.includes(language);
}

async function updateNumberOfViewers({ liveStream }) {
  const liveStreamId = liveStream._id.toString();

  const url = !liveStream.domain
    ? `${Config.antMediaBaseUrl}/v2/broadcasts/${liveStreamId}/broadcast-statistics`
    : `https://${liveStream.domain}/WebRTCAppEE/rest/v2/broadcasts/${liveStreamId}/broadcast-statistics`;

  const res = await Utils.sendRequest({ method: "GET", url });

  const { totalWebRTCWatchersCount } = res;

  const dataToSend = {
    messageType: "numberOfViewers",
    liveStreamId,
    viewsData: {
      totalWebRTCWatchersCount,
    },
  };

  await Utils.sendMessageToLiveStream({ liveStream, data: dataToSend });
}

async function sendUpdateMessage({ liveStream }) {
  const liveStreamId = liveStream._id.toString();

  await formatLiveStreamResponse({ liveStream });

  const dataToSend = {
    messageType: "streamUpdated",
    liveStreamId,
    streamData: liveStream,
  };

  await Utils.sendMessageToLiveStream({ liveStream, data: dataToSend });
}

module.exports = { isLanguageValid, updateNumberOfViewers, sendUpdateMessage };
