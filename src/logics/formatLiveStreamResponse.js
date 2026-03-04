"use strict";

const { User, Membership } = require("#models");

const findUserProps = { phoneNumber: 1, userName: 1, created: 1, avatar: 1, bankAccounts: 1 };

async function formatLiveStreamResponse({ liveStream }) {
  const streamer = await User.findById(liveStream.userId, findUserProps).lean();
  const userId = streamer._id.toString();

  const creatorMemberships = await Membership.find({ creatorId: userId, deleted: false })
    .sort({ order: 1 })
    .lean();
  streamer.creatorMemberships = creatorMemberships;

  if (streamer.activeLiveStream) {
    delete streamer.activeLiveStream;
  }

  if (liveStream.comments) {
    delete liveStream.comments;
  }

  liveStream.user = streamer;

  if (liveStream?.cohosts && liveStream.cohosts.length > 0) {
    liveStream.cohosts = await User.find(
      { _id: { $in: liveStream.cohosts } },
      findUserProps
    ).lean();

    const { mutedCohosts = [], additionalCohostCameras = [] } = liveStream;

    for (const cohost of liveStream.cohosts) {
      if (!cohost.liveSettings) cohost.liveSettings = {};

      if (mutedCohosts.includes(cohost._id.toString())) {
        cohost.liveSettings.cohostMuted = true;
      }

      if (additionalCohostCameras.length > 0) {
        cohost.additionalCameras = additionalCohostCameras.filter(
          (camera) => camera.cohostId === cohost._id.toString()
        );
      }
    }
  }

  if (liveStream?.activeCohosts && liveStream?.activeCohosts.length > 0) {
    liveStream.activeCohosts = liveStream.activeCohosts
      .filter((cohost) => {
        if (!cohost.endTimeStamp || cohost.endTimeStamp < cohost.startTimeStamp) return true;

        return false;
      })
      .sort((a, b) => a.startTimeStamp - b.startTimeStamp);
  }
}

module.exports = formatLiveStreamResponse;
