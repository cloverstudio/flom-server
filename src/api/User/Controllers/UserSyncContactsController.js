"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { UserContact, User, SmsData, Configuration, NonFlomContact } = require("#models");
const { sendBonus } = require("#logics");

/**
      * @api {post} /api/v2/user/sync User Sync Contacts
      * @apiName User Sync Contacts
      * @apiGroup WebAPI
      * @apiDescription User Sync Contacts
      *   
      * @apiParam {String} phoneNumbers should receive with all numbers like this: "+385987654324,+385998765456,+385916342536"
      * @apiParam {String} userId userId /String
      * 
      * @apiSuccessExample Success-Response:
        {
            "code": 1,
            "time": 1507293117920,
            "data": {
                "users": [
                    {
                        "_id": "59d5f9dfc4282cb82e229519",
                        "phoneNumber": "+385976376676",
                        "userid": "+385976376676",
                        "name": "ivo2345",
                        "description": "",
                        "flow"; {},
                        "bankAccounts"; []
                    },
                    {
                        "_id": "59d607f4ad8f7e8b23c10af2",
                        "phoneNumber": "+385989057351",
                        "userid": "+385989057351",
                        "name": "Jura",
                        "description": "debeli jura",
                        "avatar": {
                            "thumbnail": {
                                "originalName": "images.jpg",
                                "size": 7897,
                                "mimeType": "jpeg",
                                "nameOnServer": "udbipys2F14jrRC5a1L19HSGKL8MpIaC"
                            },
                            "picture": {
                                "originalName": "images.jpg",
                                "size": 3269,
                                "mimeType": "image/jpeg",
                                "nameOnServer": "bq1EeoYyK5yOsVRqSywPXk80nYdv8jK3"
                            }
                        },
                        "flow": {},
                        "bankAccounts": []
                    }
                ]
            }
        }
 
     */

router.post("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const { user } = request;

    if ((Utils.now() - user.dateOfBirth) / Const.milisInYear >= 16) {
      request.body.phoneNumbers = request.body.phoneNumbers + ",+2340000000000";
    }

    const { phoneNumbers: phoneNumbersString } = request.body;
    const phoneNumbers = phoneNumbersString
      .split(",")
      .map((n) => n.trim())
      .filter((e) => e.length > 8);

    const flomUsers = await User.find(
      {
        phoneNumber: {
          $in: phoneNumbers,
        },
        status: Const.userStatus.enabled,
        isAppUser: true,
        "isDeleted.value": false,
      },
      {
        userid: true,
        phoneNumber: true,
        name: true,
        userName: true,
        description: true,
        avatar: true,
        created: true,
        bankAccounts: true,
        location: true,
        aboutBusiness: true,
        businessCategory: true,
        workingHours: true,
        isAppUser: true,
        pushToken: true,
        voipPushToken: true,
        webPushSubscription: true,
        nigerianBankAccounts: true,
      },
    ).lean();

    const flomNumbers = flomUsers.map((user) => user.phoneNumber);
    const newNonFlomContacts = phoneNumbers
      .filter((number) => {
        const formattedNumber = Utils.formatPhoneNumber({ phoneNumber: number });

        if (!flomNumbers.includes(number) && formattedNumber) {
          return true;
        }

        return false;
      })
      .map((number) => {
        const formattedNumber = Utils.formatPhoneNumber({ phoneNumber: number });
        const hashedPhoneNumber = Utils.hash(formattedNumber);

        return {
          userId: user._id.toString(),
          hashedPhoneNumber,
        };
      });

    if (newNonFlomContacts.length > 0) {
      const operations = newNonFlomContacts.map((entry) => ({
        updateOne: {
          filter: { userId: entry.userId, hashedPhoneNumber: entry.hashedPhoneNumber },
          update: { $set: entry },
          upsert: true,
        },
      }));

      await NonFlomContact.bulkWrite(operations);

      // await NonFlomContact.create(newNonFlomContacts);
    }

    await syncContacts(flomUsers, user._id);

    const customerActivationData = await Utils.getCustomerActivationData({});

    // Sending bonus data package
    if (phoneNumbers.length > 5) {
      if (customerActivationData.sendDataForSync) {
        await sendBonus({
          userId: user._id.toString(),
          userPhoneNumber: user.phoneNumber,
          bonusType: Const.dataForSync,
        });
      }

      await sendBonus({
        userId: user._id.toString(),
        bonusType: Const.bonusTypeSync,
      });
    }

    const isNewUser = user.status === 1 && !user.newUserNotificationSent;

    if (!isNewUser) {
      return Base.successResponse(response, Const.responsecodeSucceed, {
        users: flomUsers,
      });
    }

    // Sending push messages to user's flom contacts that he has registered
    await notifyUsersContactHasRegistered({ user });

    // Sending invite SMS to new user's non flom contacts
    if (
      user.newUserNotificationSent !== true &&
      customerActivationData.totalSpending < customerActivationData.totalSpendingCap
    ) {
      sendNotifications(phoneNumbers, flomUsers, user, customerActivationData);
    } else if (customerActivationData.totalSpending > customerActivationData.totalSpendingCap) {
      logger.info(
        "UserSyncContactsController, totalSpending higher than totalSpendingCap, invite sms will not be sent",
      );
    }

    await User.findByIdAndUpdate(user._id, {
      newUserNotificationSent: true,
    });

    //const flomNGNUsersWithBankLogos = addLogosToBankAccountsForNGNUsers(flomUsers);

    Base.successResponse(response, Const.responsecodeSucceed, {
      users: flomUsers,
    });
  } catch (error) {
    logger.error("UserSyncContactsController", error);
    return Base.errorResponse(response, Const.httpCodeServerError);
  }
});

async function syncContacts(flomUsers, userId) {
  try {
    let oldUserContacts = await UserContact.find({
      userId: userId,
    });

    let newUserContacts = flomUsers.map(({ _id, name }) => ({ _id, name }));

    let objNewContactsIds = {};
    let objOldContactsIds = {};

    newUserContacts.map((contact) => {
      objNewContactsIds[contact._id.toString()] = true;
    });
    oldUserContacts.map((contact) => {
      objOldContactsIds[contact.contactId.toString()] = true;
    });

    // check contacts to remove
    let contactsToRemove = [];
    oldUserContacts.forEach((contact) => {
      if (!objNewContactsIds[contact.contactId.toString()]) {
        contactsToRemove.push(contact.contactId.toString());
      }
    });

    await UserContact.deleteMany({
      contactId: {
        $in: contactsToRemove,
      },
      userId: userId,
    });

    // check contacts to add
    let contactsToAdd = [];
    newUserContacts.forEach((contact) => {
      if (!objOldContactsIds[contact._id.toString()]) {
        let newContact = {
          name: contact.name,
          userId: userId.toString(),
          contactId: contact._id.toString(),
        };
        contactsToAdd.push(newContact);
      }
    });
    await UserContact.insertMany(contactsToAdd);
    await updateExistingContacts(userId, newUserContacts);
  } catch (error) {
    throw new Error(error);
  }
}

async function updateExistingContacts(userId, users) {
  let usersIds = users.map((u) => u._id.toString());

  let userContacts = await UserContact.find({
    userId: userId,
    contactId: { $in: usersIds },
  });

  let toUpdate = [];

  userContacts.forEach(({ _id, name, contactId }) => {
    let user = users.find((u) => u._id.toString() === contactId);

    if (user && user.name !== name) {
      toUpdate.push({ _id, name: user.name });
    }
  });

  const bulkWriteArray = [];
  for (let i = 0; i < toUpdate.length; i++) {
    const { _id, name } = toUpdate[i];
    bulkWriteArray.push({ updateOne: { filter: { _id }, update: { name } } });
  }
  await UserContact.bulkWrite(bulkWriteArray);
}

async function sendNotifications(phoneNumbers, flomUsers, user, customerActivationData) {
  logger.info(`UserSyncContactsController, should send FLOM push to ${flomUsers.length} numbers!`);
  for (const flomUser of flomUsers) {
    await Utils.wait(0.2);

    await Utils.sendFlomPush({ newUser: user, receiverUser: flomUser });
  }

  const flomPhoneNumbers = flomUsers.map((user) => user.phoneNumber);
  let nonFlomNumbers = phoneNumbers.filter((number) => !flomPhoneNumbers.includes(number));

  const numbersInviteAlreadySent = await SmsData.find({
    phoneNumber: { $in: nonFlomNumbers },
    type: "invite",
    status: "sent",
  }).distinct("phoneNumber");
  nonFlomNumbers = nonFlomNumbers.filter((number) => !numbersInviteAlreadySent.includes(number));

  if (customerActivationData.sendInviteToNgNumbers && !user.phoneNumber.startsWith("+385")) {
    const qriosSMSReceivers = nonFlomNumbers.filter(
      (number) =>
        number.startsWith("+234") &&
        !number.startsWith("+234803200") &&
        !number.startsWith("+234810000"),
    );

    if (qriosSMSReceivers.length === 0) return;

    logger.info(
      `UserSyncContactsController, sending Qrios SMS to ${qriosSMSReceivers.length} numbers!`,
    );

    const pushData = {
      phoneNumbers: qriosSMSReceivers.join(","),
      message: "invite",
      type: "invite",
    };

    Utils.callBatchSMSService(pushData);
  }

  if (customerActivationData.sendInviteToNonNgNumbers && !user.phoneNumber.startsWith("+385")) {
    const twilioSMSReceivers = nonFlomNumbers.filter((number) => !number.startsWith("+234"));

    if (twilioSMSReceivers.length === 0) return;

    const pushData = {
      phoneNumbers: twilioSMSReceivers.join(","),
      message: "invite",
      type: "invite",
    };

    Utils.callBatchSMSService(pushData);
  }
}

async function notifyUsersContactHasRegistered({ user }) {
  if (user.newUserNotificationSent === true) return;

  const hashedPhoneNumber = Utils.hash(user.phoneNumber);

  const userIdsSet = new Set();
  (await NonFlomContact.find({ hashedPhoneNumber }).lean()).forEach((item) => {
    userIdsSet.add(item.userId);
  });
  const userIdsToNotify = Array.from(userIdsSet);

  if (userIdsToNotify.length === 0) return;

  const usersToNotify = await User.find({ _id: { $in: userIdsToNotify } }).lean();

  let { value: pushMessageText = null } =
    (await Configuration.findOne({ name: "contactRegisteredPushMessage" }).lean()) || {};
  pushMessageText = pushMessageText || Const.defaultContactRegisteredPushMessage;

  const fixedPushMessageText = Utils.replaceAll(pushMessageText, "[User]", user.userName);

  const flomAgent = await User.findById(Config.flomSupportAgentId).lean();

  for (const flomUser of usersToNotify) {
    try {
      await Utils.wait(0.2);

      await Utils.sendFlomPush({
        newUser: flomAgent,
        receiverUser: flomUser,
        message: fixedPushMessageText,
        messageiOs: fixedPushMessageText,
        pushType: Const.pushTypeContactRegistered,
        isMuted: true,
      });
    } catch (error) {
      continue;
    }
  }

  await NonFlomContact.deleteMany({ hashedPhoneNumber });
}

module.exports = router;
