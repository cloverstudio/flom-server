const { db } = require("#infra");
const mongoose = require("mongoose");
const { Const } = require("#config");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    type: { type: String, index: true },
    status: { type: String, index: true },
    callStatus: { type: String, index: true },
    callStartAt: Number,
    callFinishAt: Number,
    callerUserId: { type: String, index: true },
    calleeUserId: { type: String, index: true },
    connectedUsers: [String],
    callRoomId: { type: String, index: true },
    created: Number,
    callerDevice: String,
    calleeDevice: String,
  },
  { timestamps: true },
);

schema.statics.updateStatusByCallerId = async function (callerId, status, callStatus) {
  let callLogs = await this.find({
    callerUserId: callerId,
    callStatus: { $ne: Const.callStatusEnded },
  }).sort({ created: -1 });

  if (!callLogs || !callLogs.length) return;
  try {
    await this.findByIdAndUpdate(callLogs[0]._id.toString(), {
      status: status,
      callStatus: callStatus,
    });
  } catch (error) {
    console.log("Error while updating callLog: ", error);
  }
};

schema.statics.killAllCalls = async function (callerId) {
  let query = {
    callerUserId: callerId,
    $or: [{ callStatus: Const.callStatusCalling }, { callStatus: Const.callStatusRinging }],
  };
  let update = {
    callStatus: Const.callStatusEnded,
    status: Const.callStatusCallUnreachable,
  };
  let res = await this.updateMany(query, update);

  return res;
};

schema.statics.updateStatus = async function (ids, status, callStatus) {
  let callLogs = await this.find({
    callerUserId: { $in: ids },
    callStatus: { $ne: Const.callStatusEnded },
  }).sort({ created: -1 });

  if (!callLogs || !callLogs.length) return;
  try {
    await this.findByIdAndUpdate(callLogs[0]._id.toString(), {
      status: status,
      callStatus: callStatus,
    });
  } catch (error) {
    console.log("Error while updating callLog: ", error);
  }
};

schema.statics.updateStatusByRoomId = async function (callRoomId, status, callStatus) {
  try {
    let callLogs = await this.find({
      callRoomId: callRoomId,
      callStatus: { $ne: Const.callStatusEnded },
    }).sort({ created: -1 });

    let lastCallLog = callLogs[0];

    if (!lastCallLog) {
      throw new Error("updateStatusByRoomId: no last callLog!", {
        callRoomId,
        status,
        callStatus,
      });
    }

    let result = await this.findByIdAndUpdate(lastCallLog._id.toString(), {
      status: status,
      callStatus: callStatus,
    });

    return result;
  } catch (error) {
    console.log("Error while updating callLog: ", error);
    return error;
  }
};

schema.statics.updateStatusByCalleeId = async function (calleeId, status, callStatus) {
  let callLogs = await this.find({
    callerUserId: calleeId,
    callStatus: { $ne: Const.callStatusEnded },
  }).sort({ created: -1 });

  if (!callLogs || !callLogs.length) return;

  try {
    await this.findByIdAndUpdate(callLogs[0]._id.toString(), {
      status: status,
      callStatus: callStatus,
    });
  } catch (error) {
    console.log("Error while updating callLog: ", error);
  }
};

schema.statics.callFinish = async function (userId, cb) {
  try {
    let callLogs = await this.find({
      callerUserId: userId,
      status: Const.callStatusConnected,
      callFinishAt: null,
    });

    if (!callLogs || !callLogs.length) {
      callLogs = await this.find({
        calleeUserId: userId,
        status: Const.callStatusConnected,
        callFinishAt: null,
      });
    }

    if (!callLogs) return;

    const updateCallLog = async (callLog) => {
      try {
        return await this.findByIdAndUpdate(callLog._id.toString(), {
          callFinishAt: Date.now(),
          callStatus: Const.callStatusEnded,
        });
      } catch (error) {
        console.log("Error while updating callLog: ", error);
      }
    };

    callLogs = callLogs.map(updateCallLog);

    callLogs = await Promise.all(callLogs);

    return callLogs;
  } catch (error) {
    console.log("error while updating callFinish", error);
  }
};

schema.statics.disconnectCall = async function (userId) {
  try {
    let callLogs = await this.find({
      callerUserId: userId,
      status: Const.callStatusConnected,
      callFinishAt: null,
    }).sort({ created: -1 });

    if (!callLogs || !callLogs.length) {
      callLogs = await this.find({
        calleeUserId: userId,
        status: Const.callStatusConnected,
        callFinishAt: null,
      }).sort({ created: -1 });
    }

    await this.findByIdAndUpdate(callLogs[0]._id.toString(), {
      callStatus: Const.callStatusReconnecting,
      connectedUsers: [],
    });
  } catch (error) {
    console.log("Error while updating callLog: ", error);
  }
};

schema.statics.disconnectCallByCallRoomId = async function (callRoomId) {
  try {
    await this.updateOne(
      { callRoomId },
      { callStatus: Const.callStatusReconnecting, connectedUsers: [] },
    );
  } catch (error) {
    console.log("Error while updating callLog: ", error);
  }
};

schema.statics.connectCall = async function (userId) {
  try {
    let callLogs = await this.find({
      $and: [
        {
          $or: [{ callerUserId: userId }, { calleeUserId: userId }],
        },
        { callStatus: { $not: { $eq: Const.callStatusEnded } } },
      ],
    }).sort({ created: -1 });

    let callLog = callLogs[0];

    // check if user is already connected
    const isUserConnected = (userId, connectedUsers) => {
      let connected = false;
      let userIndex = connectedUsers.indexOf(userId);
      if (userIndex > -1) connected = true;

      return connected;
    };

    let { connectedUsers, callStatus } = callLog || [];
    const alreadyConnected = isUserConnected(userId, connectedUsers);

    if (!alreadyConnected) {
      connectedUsers.push(userId);
    }

    const allUsersConnected = connectedUsers.length === 2;

    if (allUsersConnected) callStatus = Const.callStatusAllConnected;

    await this.findByIdAndUpdate(callLog._id.toString(), { callStatus, connectedUsers });
  } catch (error) {
    console.log("Error while updating callLog: ", error);
  }
};

schema.statics.connectCallByCallRoomId = async function (callRoomId, userId) {
  try {
    const callLog = await this.findOne({
      callRoomId,
    });

    // check if user is already connected
    const isUserConnected = (userId, connectedUsers) => connectedUsers.indexOf(userId) > -1;

    let { connectedUsers, callStatus } = callLog;
    const alreadyConnected = isUserConnected(userId, connectedUsers);

    if (!alreadyConnected) {
      connectedUsers.push(userId);
    }

    const allUsersConnected = connectedUsers.length === 2;

    if (allUsersConnected) {
      callStatus = Const.callStatusAllConnected;
    }

    await this.findByIdAndUpdate(callLog._id.toString(), { callStatus, connectedUsers });
  } catch (error) {
    console.log("Error while updating callLog: ", error);
  }
};

schema.statics.findLatestCallByUserId = async function (userId) {
  let callLogs = await this.find({
    $and: [
      {
        $or: [{ callerUserId: userId }, { calleeUserId: userId }],
      },
      { callStatus: { $not: { $eq: Const.callStatusEnded } } },
      { created: { $gte: Date.now() - 4 * 60 * 60 * 1000 } }, // last 4h
    ],
  }).sort({ created: -1 });

  if (callLogs && callLogs.length) {
    return callLogs[0].toObject();
  } else {
    return null;
  }
};

schema.statics.isUserHaveAnotherCall = async function (userId, callRoomId) {
  let callLogs = await this.find({
    $and: [
      {
        $or: [{ callerUserId: userId }, { calleeUserId: userId }],
      },
      { callStatus: { $not: { $eq: Const.callStatusEnded } } },
      //{ "connectedUsers.1": { $exists: true } },
      { created: { $gte: Date.now() - 2 * 60 * 60 * 1000 } }, // last 2h
    ],
  }).sort({ created: -1 });

  if (callLogs && callLogs.length) {
    const callRoomIdBase = callRoomId.split("_")[0];
    const calls = callLogs.filter((cl) => !cl.callRoomId.startsWith(callRoomIdBase));

    console.log({ calls });
    return calls;
  } else {
    return false;
  }
};

schema.statics.findOpenCallByUserId = async function (userId) {
  let callLogs = await this.find({
    callerUserId: userId,
    $or: [{ callStatus: Const.callStatusCalling }, { callStatus: Const.callStatusRinging }],
  }).sort({ created: -1 });

  if (callLogs && callLogs.length) {
    return callLogs;
  } else {
    return [];
  }
};

module.exports = db.db1.model("CallLog", schema, "call_logs");
