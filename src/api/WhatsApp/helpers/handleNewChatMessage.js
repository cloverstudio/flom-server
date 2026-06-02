"use strict";

const { logger } = require("#infra");
const { Const } = require("#config");
const { User, WhatsAppUserMapping, WhatsAppLog, WhatsAppSession } = require("#models");
const Logics = require("#logics");

async function handleNewChatMessage({
  from,
  msgBody,
  wamId,
  timeStamp,
  logId,
  messageType,
  file,
  location,
}) {
  console.log(
    "new chat message, from: ",
    from,
    "msgBody: ",
    msgBody,
    "wamId: ",
    wamId,
    "messageType: ",
    messageType,
    "file: ",
    file,
    "location: ",
    location,
  );

  let fromUser = await User.findOne({ phoneNumber: from }).lean();

  if (!fromUser) {
    fromUser = await Logics.createNewUser({
      phoneNumber: from,
      isAppUser: false,
      shadow: true,
      hasLoggedIn: Const.userShadowUser,
      phoneNumberStatus: Const.phoneNumberUntested,
    });
  }

  let toUser = null;

  const regexRef = /ref_([A-Za-z]+)/;
  const refMatch = msgBody.match(regexRef);
  if (refMatch) {
    const reference = refMatch[1];
    toUser = await User.findOne({ "whatsApp.reference": reference }).lean();
  }

  if (!toUser) {
    const regexMention = /(?<!\w)@([a-zA-Z0-9_]+)/g;
    const matches = [...msgBody.matchAll(regexMention)];
    const toUserName = matches.length > 0 ? matches[0][1] : null;

    if (toUserName) {
      toUser = await User.findOne({ $or: [{ slug: toUserName }, { oldSlug: toUserName }] }).lean();
    }
  }

  if (!toUser) {
    const session = await WhatsAppSession.findOne({ from }).sort({ expiresAt: -1 }).lean();

    if (session && session.expiresAt > new Date()) {
      toUser = await User.findOne({ phoneNumber: session.to }).lean();
    } else if (session) {
      toUser = await User.findOne({ phoneNumber: session.to }).lean();

      await Logics.sendWhatsAppMessage({
        to: from,
        message: `Continue with @${session.toSlug}?`,
        isFreeMessage: true,
      });

      return;
    }
  }

  if (!toUser) {
    if (!fromUser.whatsApp?.receivedUnknownRecipientNotice) {
      await Logics.sendWhatsAppMessage({
        to: from,
        template: "unknownRecipientNotice",
      });

      await User.updateOne(
        { _id: fromUser._id },
        { $set: { "whatsApp.receivedUnknownRecipientNotice": true } },
      );
    }

    logger.error(
      "WhatsAppCallbackController, cb: toUser not found from message: " +
        msgBody +
        " and sender: " +
        from,
    );
    return;
  }

  await WhatsAppSession.updateOne(
    { from, to: toUser.phoneNumber },
    { toSlug: toUser.slug, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { upsert: true },
  );

  // mapping is reversed (sender is receiver etc) because we want to find the mapping with sender and receiver phone numbers when sending message from app to whatsapp
  await WhatsAppUserMapping.findOneAndUpdate(
    {
      senderId: toUser._id.toString(),
      senderPhoneNumber: toUser.phoneNumber,
      receiverId: fromUser._id.toString(),
      receiverPhoneNumber: from,
    },
    { $set: { enabled: true } },
    { upsert: true },
  );

  await WhatsAppLog.findByIdAndUpdate(logId, { to: toUser.phoneNumber });

  let roomId = null;
  if (toUser && fromUser.created < toUser.created) {
    roomId = `1-${fromUser._id.toString()}-${toUser?._id.toString()}`;
  } else if (toUser) {
    roomId = `1-${toUser?._id.toString()}-${fromUser._id.toString()}`;
  }
  if (!roomId) {
    logger.error("WhatsAppCallbackController, cb: invalid roomId");
    return;
  }

  const params = {
    isRecursiveCall: false,
    type: messageType,
    userID: fromUser._id.toString(),
    roomID: roomId,
    message: msgBody,
    created: timeStamp,
    wamId,
    plainTextMessage: true,
    file,
    location,
  };

  await Logics.sendMessage(params);

  return;
}

module.exports = handleNewChatMessage;
