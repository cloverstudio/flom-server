const { Const } = require("#config");

function chatIdByUser(user1, user2) {
  var chatId = "";

  if (user1.created < user2.created) {
    chatId = Const.chatTypePrivate + "-" + user1._id + "-" + user2._id;
  } else {
    chatId = Const.chatTypePrivate + "-" + user2._id + "-" + user1._id;
  }

  return chatId;
}

module.exports = chatIdByUser;
