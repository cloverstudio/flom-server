"use strict";

const { Const } = require("#config");
const { User } = require("#models");

async function getSubscribers({ userId, subscriberIds = [], allSubscribers, page, size, search }) {
  try {
    const options = { sort: { userName: 1 } };

    let query = {
      followedBusinesses: userId,
      _id: { $in: subscriberIds },
      "isDeleted.value": false,
    };

    if (allSubscribers) {
      query = { followedBusinesses: userId, "isDeleted.value": false };
    }

    const formattedSubscribers = [];

    if (page && size) {
      options.skip = (page - 1) * size;
      options.limit = size;
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    const subscribers = await User.find(query, null, options).lean();
    const subscriberCount = await User.countDocuments(query);

    for (const s of subscribers) {
      const data = {
        _id: s._id.toString(),
        phoneNumber: s.phoneNumber,
        avatar: s.avatar,
        userName: s.userName,
        channels: { flom: true },
      };
      s.inApp = true;

      if (s.hasLoggedIn !== Const.userLoggedInAtLeastOnce) {
        data.userName = data.phoneNumber;
        data.channels = { whatsapp: true, whatsappType: "paid" };
        s.inApp = false;

        if (s.whatsApp?.windowExpiresAt && s.whatsApp.windowExpiresAt > Date.now()) {
          data.channels.whatsappType = "free";
        }
      }

      formattedSubscribers.push(data);
    }

    return {
      subscribers: formattedSubscribers,
      rawSubscribers: subscribers,
      subscriberCount,
    };
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return { subscribers: [] };
  }
}

module.exports = getSubscribers;
