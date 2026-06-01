"use strict";

const { FlomMessage, User, WhatsAppLog } = require("#models");

async function handleOutgoingMessage({ to, status, wamId, errors, callback }) {
  const user = await User.findOne({ phoneNumber: to }).lean();
  const flomMessage = await FlomMessage.findOne({ wamId }).lean();

  await WhatsAppLog.findOneAndUpdate({ wamId }, { status, callback, failures: errors });

  // if no chat message found then it is probably a WA notification
  if (!flomMessage) {
    return;
  }

  if (status === "sent") {
    await FlomMessage.updateOne(
      { wamId },
      { $addToSet: { sentTo: user._id.toString() }, $set: { wamStatus: status } },
    );
  } else if (status === "delivered") {
    const deliveredTo = flomMessage?.deliveredTo;

    let alreadyDelivered = false;
    if (deliveredTo) {
      for (const item of deliveredTo) {
        if (item.userId === user._id.toString()) {
          item.at = Date.now();
          alreadyDelivered = true;
          await FlomMessage.updateOne(
            { wamId },
            { $set: { deliveredTo: deliveredTo, wamStatus: status } },
          );
          break;
        }
      }
    }

    if (!alreadyDelivered) {
      await FlomMessage.updateOne(
        { wamId },
        {
          $addToSet: { deliveredTo: { userId: user._id.toString(), at: Date.now() } },
          $set: { wamStatus: status },
        },
      );
    }
  } else if (status === "read") {
    const seenBy = flomMessage?.seenBy ?? [];

    let alreadySeen = false;
    for (const item of seenBy) {
      if (item.user === user._id.toString()) {
        item.at = Date.now();
        alreadySeen = true;
        await FlomMessage.updateOne({ wamId }, { $set: { seenBy: seenBy, wamStatus: status } });
        break;
      }
    }

    if (!alreadySeen) {
      await FlomMessage.updateOne(
        { wamId },
        {
          $addToSet: { seenBy: { user: user._id.toString(), at: Date.now() } },
          $set: { wamStatus: status },
        },
      );
    }
  } else if (status === "failed" || !!errors) {
    await FlomMessage.updateOne(
      { wamId },
      { $set: { "attributes.errors": errors, wamStatus: status } },
    );
  }
}

module.exports = handleOutgoingMessage;
