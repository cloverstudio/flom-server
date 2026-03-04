"use strict";

const { Const } = require("#config");
const { LiveStream } = require("#models");
const { sendBonus } = require("#logics");
const { sendUpdateMessage, updateNumberOfViewers } = require("./helpers");

async function sendComment({ liveStream, commentData }) {
  if (!commentData) return;

  const liveStreamId = liveStream._id.toString();

  const updatedLiveStream = await LiveStream.findByIdAndUpdate(
    liveStreamId,
    { $addToSet: { comments: commentData } },
    {
      new: true,
      lean: true,
    },
  );

  await sendBonus({
    userId: commentData.sender._id,
    bonusType: Const.bonusTypeLiveStreamComment,
    liveStreamId,
    liveStreamName: liveStream.name,
    ownerId: liveStream.userId,
  });
}

async function joinedToStream({ liveStream, userData }) {
  if (!userData) return;

  const liveStreamId = liveStream._id.toString();
  const userId = userData._id;
  const updateObj = {};
  updateObj.$inc = { totalNumberOfViews: 1 };
  let sendUpdateMsg = false;

  const { cohosts = [], activeCohosts = [], type: streamType } = liveStream;

  if (streamType === Const.liveStreamTypeEvent && cohosts.includes(userId)) {
    if (activeCohosts.some((cohost) => cohost.userId === userId)) {
      await LiveStream.findByIdAndUpdate(liveStreamId, {
        $pull: { activeCohosts: { userId } },
      });
    }

    updateObj.$push = { activeCohosts: { userId, startTimeStamp: Date.now() } };
    sendUpdateMsg = true;
  } else {
    updateObj.$push = { viewerIds: userData._id };
  }

  const updatedLiveStream = await LiveStream.findByIdAndUpdate(liveStreamId, updateObj, {
    new: true,
    lean: true,
  });

  if (sendUpdateMsg) {
    await sendUpdateMessage({ liveStream: updatedLiveStream });
  }

  await updateNumberOfViewers({ liveStream: updatedLiveStream });
}

async function leaveFromStream({ liveStream, userData }) {
  if (!userData) return;

  const liveStreamId = liveStream._id.toString();
  const userId = userData._id;
  const updateObj = {};
  let sendUpdateMsg = false;

  const { cohosts = [], activeCohosts = [], type: streamType } = liveStream;

  if (
    streamType === Const.liveStreamTypeEvent &&
    cohosts.includes(userId) &&
    activeCohosts.some((cohost) => cohost.userId === userId)
  ) {
    const cohost = activeCohosts.find((cohost) => cohost.userId === userId);

    await LiveStream.findByIdAndUpdate(liveStreamId, {
      $pull: { activeCohosts: { userId } },
    });

    updateObj.$push = { activeCohosts: { ...cohost, endTimeStamp: Date.now() } };
    sendUpdateMsg = true;
  } else {
    updateObj.$pull = { viewerIds: userData._id };
  }

  const updatedLiveStream = await LiveStream.findByIdAndUpdate(liveStreamId, updateObj, {
    new: true,
    lean: true,
  });

  if (sendUpdateMsg) {
    await sendUpdateMessage({ liveStream: updatedLiveStream });
  }

  await updateNumberOfViewers({ liveStream: updatedLiveStream });
}

module.exports = {
  joinedToStream,
  sendComment,
  leaveFromStream,
};
