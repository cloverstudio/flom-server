// .js

const async = require("async");
const _ = require("lodash");
const { Const } = require("#config");
const { User, Room, Group, History } = require("#models");

function isFile(messageType) {
  return (
    messageType == Const.messageTypeFile ||
    messageType == Const.messageTypeAudio ||
    messageType == Const.messageTypeVideo ||
    messageType == Const.messageTypeImage
  );
}

var UpdateHistory = {
  resetUnreadCount: function (obj) {
    var rawRoomId = obj.roomID;
    var userId = obj.userID;

    if (_.isEmpty(rawRoomId) || _.isEmpty(userId)) return;

    var roomIdSplitted = rawRoomId.split("-");
    var roomType = roomIdSplitted[0];

    var chatId = "";

    // private chat
    if (roomType == Const.chatTypePrivate) {
      if (roomIdSplitted.length != 3) return;

      // roomId = 1-user1-user2 user1: which has lower created timestamp

      var user1 = roomIdSplitted[1];
      var user2 = roomIdSplitted[2];
      var toUserId = "";

      if (user1 == userId) {
        toUserId = user2;
      } else {
        toUserId = user1;
      }

      chatId = toUserId;
    }

    // group chat
    if (roomType == Const.chatTypeGroup) {
      if (roomIdSplitted.length != 2) return;

      chatId = roomIdSplitted[1];
    }

    // room chat
    if (roomType == Const.chatTypeRoom || roomType == Const.chatTypeBroadcastAdmin) {
      if (roomIdSplitted.length != 2) return;

      chatId = roomIdSplitted[1];
    }

    async.waterfall(
      [
        function (done) {
          var result = {};

          // search history object
          History.findOne(
            {
              userId: userId,
              chatId: chatId,
            },
            function (err, findResult) {
              result.historyObj = findResult;
              done(err, result);
            },
          );
        },
        function (result, done) {
          if (result.historyObj) {
            result.historyObj.update(
              {
                unreadCount: 0,
                lastUpdateUnreadCount: Date.now(),
              },
              {},
              function (err, updateResult) {
                done(err, result);
              },
            );
          }
        },
      ],
      function (err, result) {},
    );
  },
  updateByMessage: function (obj, callBack) {
    var rawRoomId = obj.roomID;
    var userId = obj.userID;
    var messageId = obj._id;

    if (_.isEmpty(rawRoomId) || _.isEmpty(userId) || _.isEmpty(messageId)) return;

    var roomIdSplitted = rawRoomId.split("-");
    var roomType = roomIdSplitted[0];

    // private chat
    if (roomType == Const.chatTypePrivate) {
      if (roomIdSplitted.length != 3) return;

      // roomId = 1-user1-user2 user1: which has lower created timestamp

      var user1 = roomIdSplitted[1];
      var user2 = roomIdSplitted[2];
      var fromUserId = userId;
      var toUserId = "";

      if (user1 == userId) {
        toUserId = user2;
      } else {
        toUserId = user1;
      }

      this.updateByPrivateChat(fromUserId, toUserId, obj, () => {
        if (callBack) callBack();
      });
    }

    // group chat
    if (roomType == Const.chatTypeGroup) {
      if (roomIdSplitted.length != 2) return;

      var groupId = roomIdSplitted[1];
      var fromUserId = userId;

      this.updateByGroupChat(fromUserId, groupId, obj, () => {
        if (callBack) callBack();
      });
    }

    // room chat
    if (roomType == Const.chatTypeRoom || roomType == Const.chatTypeBroadcastAdmin) {
      if (roomIdSplitted.length != 2) return;

      var roomId = roomIdSplitted[1];
      var fromUserId = userId;

      this.updateByRoomChat(fromUserId, roomId, obj, () => {
        if (callBack) callBack();
      });
    }
  },

  newRoom: function (roomObj) {
    var self = this;

    if (_.isEmpty(roomObj.users) || _.isEmpty(roomObj._id)) return;

    async.each(
      roomObj.users,
      function (userId, done) {
        var historyData = {
          userId: userId,
          chatId: roomObj._id,
          chatType:
            roomObj.type == Const.chatTypeBroadcastAdmin
              ? Const.chatTypeBroadcastAdmin
              : Const.chatTypeRoom,
          lastUpdate: Date.now(),
          lastUpdateUser: null,
          lastMessage: null,
          keyword: roomObj.name,
        };

        self.updateData(historyData, null, function (err, updateResult) {
          done(null);
        });
      },
      function (err) {},
    );
  },
  updateByPrivateChat: function (fromUserId, toUserId, rawMessageObj, callBack) {
    var self = this;

    async.waterfall(
      [
        function (done) {
          var result = {
            message: {
              messageId: rawMessageObj._id.toString(),
              message: rawMessageObj.message,
              created: rawMessageObj.created,
              type: rawMessageObj.type,
              sentTo: rawMessageObj.sentTo,
            },
          };

          if (isFile(rawMessageObj.type)) {
            console.log("messageId: " + rawMessageObj._id.toString());
            result.message.mimeType = rawMessageObj.file.file.mimeType;
            result.message.size = rawMessageObj.file.file.size;

            if (rawMessageObj.file.file.duration)
              result.message.duration = rawMessageObj.file.file.duration;
          }

          User.findOne(
            { _id: fromUserId },
            User.getDefaultResponseFields(),
            function (err, findUserResult) {
              result.fromUser = findUserResult;
              done(err, result);
            },
          );
        },
        function (result, done) {
          User.findOne(
            { _id: toUserId },
            User.getDefaultResponseFields(),
            function (err, findUserResult) {
              result.toUser = findUserResult;
              done(err, result);
            },
          );
        },
        function (result, done) {
          let message = result.message.message;
          if (message) message = message.substr(0, 30);
          else message = "";

          // update for fromUser
          var historyData = {
            userId: fromUserId,
            chatId: toUserId,
            chatType: Const.chatTypePrivate,
            lastUpdate: Date.now(),
            lastUpdateUser: result.fromUser,
            lastMessage: result.message,
            keyword: result.toUser.name + ", " + result.message.message,
          };

          self.updateData(historyData, rawMessageObj, function (err, updateResult) {
            done(err, result);
          });
        },
        function (result, done) {
          let message = result.message.message;
          if (message) message = message.substr(0, 30);
          else message = "";

          // update for toUser
          var historyData = {
            userId: toUserId,
            chatId: fromUserId,
            chatType: Const.chatTypePrivate,
            lastUpdate: Date.now(),
            lastUpdateUser: result.fromUser,
            lastMessage: result.message,
            keyword: result.fromUser.name + ", " + message,
          };

          self.updateData(historyData, rawMessageObj, function (err, updateResult) {
            done(err, result);
          });
        },
      ],
      function (err, result) {
        if (err) {
          console.log("Logic Error1: UpdateHistory", err);
          return;
        }

        if (callBack) callBack();
      },
    );
  },
  updateByRoomChat: function (fromUserId, roomId, rawMessageObj, callBack) {
    var self = this;

    async.waterfall(
      [
        function (done) {
          var result = {
            message: {
              messageId: rawMessageObj._id.toString(),
              message: rawMessageObj.message,
              created: rawMessageObj.created,
              type: rawMessageObj.type,
              sentTo: rawMessageObj.sentTo,
            },
          };

          if (isFile(rawMessageObj.type)) {
            result.message.mimeType = rawMessageObj.file.file.mimeType;
            result.message.size = rawMessageObj.file.file.size;

            if (rawMessageObj.file.file.duration)
              result.message.duration = rawMessageObj.file.file.duration;
          }

          // get room
          Room.findOne({ _id: roomId }, function (err, findRoomResult) {
            if (findRoomResult == null) {
              done("invalid room id", roomId);
              return;
            }

            result.room = findRoomResult;
            done(err, result);
          });
        },
        function (result, done) {
          User.findOne(
            { _id: fromUserId },
            User.getDefaultResponseFields(),
            function (err, findUserResult) {
              result.fromUser = findUserResult;
              done(null, result);
            },
          );
        },
        function (result, done) {
          if (!_.isArray(result.room.users)) {
            done("empty room", null);
            return;
          }

          async.each(
            result.room.users,
            function (userId, doneEach) {
              let message = result.message.message;
              if (message) message = message.substr(0, 30);
              else message = "";

              var historyData = {
                userId: userId,
                chatId: roomId,
                chatType:
                  result.room.type == Const.chatTypeBroadcastAdmin
                    ? Const.chatTypeBroadcastAdmin
                    : Const.chatTypeRoom,
                lastUpdate: Date.now(),
                isUnread: 1,
                lastUpdateUser: result.fromUser,
                lastMessage: result.message,
                keyword: result.room.name + ", " + message,
              };

              self.updateData(historyData, rawMessageObj, function (err, updateResult) {
                doneEach(err, result);
              });
            },
            function (err) {
              done(err, result);
            },
          );
        },
      ],
      function (err, result) {
        if (err) {
          console.log("Logic Error2: UpdateHistory", err);
          return;
        }

        if (callBack) callBack();
      },
    );
  },

  updateByGroupChat: function (fromUserId, groupId, rawMessageObj, callBack) {
    var self = this;

    async.waterfall(
      [
        function (done) {
          var result = {
            message: {
              messageId: rawMessageObj._id.toString(),
              message: rawMessageObj.message,
              created: rawMessageObj.created,
              type: rawMessageObj.type,
              sentTo: rawMessageObj.sentTo,
            },
          };

          if (isFile(rawMessageObj.type)) {
            result.message.mimeType = rawMessageObj.file.file.mimeType;
            result.message.size = rawMessageObj.file.file.size;

            if (rawMessageObj.file.file.duration)
              result.message.duration = rawMessageObj.file.file.duration;
          }

          // get group
          Group.findOne({ _id: groupId }, function (err, findGroupResult) {
            if (findGroupResult == null) {
              done("invalid group id", null);
              return;
            }

            result.group = findGroupResult;
            done(err, result);
          });
        },
        function (result, done) {
          User.findOne(
            { _id: fromUserId },
            {
              token: 0,
              pushToken: 0,
              webPushSubscription: 0,
              voipPushToken: 0,
            },
            User.getDefaultResponseFields(),
            function (err, findUserResult) {
              result.fromUser = findUserResult;
              done(err, result);
            },
          );
        },
        function (result, done) {
          // when hook fromUser doesn't exit
          if (!result.fromUser) {
            done("hook", result);
            return;
          }

          // get above departments
          PermissionLogic.getAboveDepartments(
            result.fromUser.organizationId,
            groupId,
            (departmentIds) => {
              result.departmentIds = departmentIds;
              done(null, result);
            },
          );
        },
        function (result, done) {
          // get users of above departments
          User.find(
            {
              groups: { $in: result.departmentIds },
            },
            {
              _id: 1,
            },
            (err, findResult) => {
              result.departmentUsers = _.map(findResult, "_id");
              done(err, result);
            },
          );
        },
        function (result, done) {
          var groupUsers = _.compact(
            _.union(
              result.group.users.toString().split(","),
              result.departmentUsers.toString().split(","),
            ),
          );

          async.each(
            groupUsers,
            function (userId, doneEach) {
              let message = result.message.message;
              if (message) message = message.substr(0, 30);
              else message = "";

              var historyData = {
                userId: userId,
                chatId: groupId,
                chatType: Const.chatTypeGroup,
                lastUpdate: Date.now(),
                isUnread: 1,
                lastUpdateUser: result.fromUser,
                lastMessage: result.message,
                keyword: result.group.name + ", " + message,
              };

              self.updateData(historyData, rawMessageObj, function (err, updateResult) {
                doneEach(err, result);
              });
            },
            function (err) {
              done(err, result);
            },
          );
        },
      ],
      function (err, result) {
        if (err == "hook") {
          return;
        } else if (err) {
          console.log("Logic Error3: UpdateHistory", err);
          return;
        }

        if (callBack) callBack();
      },
    );
  },

  updateData: function (data, rawMessageObj, callBack) {
    if (rawMessageObj?.type === Const.messageTypeCall) {
      data.lastMessage.callLogData = rawMessageObj.attributes.callLogData;
    }

    async.waterfall(
      [
        function (done) {
          var result = {};

          History.findOne(
            {
              userId: data.userId,
              chatId: data.chatId,
            },
            function (err, findResult) {
              result.existingData = findResult;
              done(null, result);
            },
          );
        },
        function (result, done) {
          done(null, result);
        },
        function (result, done) {
          if (rawMessageObj) {
            if (
              !rawMessageObj ||
              (result.isOnline && result.currentRoomID == rawMessageObj.roomID)
            ) {
            } else {
              if (
                !result.existingData ||
                result.existingData.unreadCount == undefined ||
                result.existingData.unreadCount == null
              ) {
                data.unreadCount = 1;
              } else if (rawMessageObj && data.userId != rawMessageObj.userID) {
                data.unreadCount = result.existingData.unreadCount + 1;
              }

              if (rawMessageObj.type == Const.messageTypeCall) {
                var callStatus = rawMessageObj.attributes.callLogData.callStatus;
                var callerUserId = rawMessageObj.attributes.callLogData.callerUserId;

                if (callStatus === 1 || callStatus === 4) {
                  data.unreadCount -= 1;
                } else if (data.userId === callerUserId) {
                  data.unreadCount -= 1;
                }
              }
            }
          }

          if (!data.unreadCount) {
            data.unreadCount = 0;
          }

          if (result.existingData) {
            result.existingData.update(data, {}, function (err, updateResult) {
              done(err, result);
            });
          } else {
            //When recent model is being created for the first time a new parameter should be added to recent model.
            //Parameter name should be: firstMessageUserI

            if (data.chatType === Const.chatTypePrivate)
              data.firstMessageUserId = data.lastUpdateUser._id.toString();

            var model = new History(data);

            model.save(function (err, insertResult) {
              result.history = insertResult;
              done(err, result);
            });
          }
        },
      ],
      function (err, result) {
        callBack(err, result);
      },
    );
  },

  updateLastMessageStatus: function (obj, callback) {
    var updateParams = {};

    if (obj.delivered) updateParams["lastMessage.delivered"] = true;

    if (obj.seen) updateParams["lastMessage.seen"] = true;

    var messageIds = !_.isEmpty(obj.messageIds) ? obj.messageIds : [obj.messageId];

    History.update(
      { "lastMessage.messageId": { $in: messageIds } },
      updateParams,
      { multi: true },
      (err, updateResult) => {
        callback(err);
      },
    );
  },
};

module.exports = UpdateHistory;
