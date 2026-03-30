const { Const } = require("#config");
const Utils = require("#utils");
const { User, UserContact } = require("#models");

async function getFlomUsers({ phoneNumbers, countryCode }) {
  const userProperties = {
    userid: true,
    phoneNumber: true,
    name: true,
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
  };

  const formattedPhoneNumbers = [];
  const phoneNumbersMapped = [];
  for (let i = 0; i < phoneNumbers.length; i++) {
    const formatted = Utils.formatPhoneNumber({ phoneNumber: phoneNumbers[i], countryCode });
    if (formatted) {
      formattedPhoneNumbers.push(formatted);
      phoneNumbersMapped.push({ rawPhoneNumber: phoneNumbers[i], flomUserPhoneNumber: formatted });
    }
  }

  const query = {
    phoneNumber: {
      $in: formattedPhoneNumbers,
    },
    status: Const.userStatus.enabled,
    isAppUser: true,
    "isDeleted.value": false,
  };

  const flomUsers = await User.find(query, userProperties).lean();

  const flomUserPhoneNumbers = {};
  flomUsers.forEach((user) => (flomUserPhoneNumbers[user.phoneNumber] = true));

  if (flomUsers && flomUsers.length) {
    return {
      flomUsers: flomUsers.map((user) => {
        return {
          ...user,
          avatar: User.getAvatar(user),
        };
      }),
      flomUsersMap: phoneNumbersMapped.filter(
        (phoneNumberMapped) => flomUserPhoneNumbers[phoneNumberMapped.flomUserPhoneNumber],
      ),
    };
  } else {
    return { flomUsers: [], flomUsersMap: [] };
  }
}

async function syncContacts({ flomUsers, userId }) {
  try {
    let oldUserContacts = await UserContact.find({
      userId,
    });
    //.slice() is used to copy arrays
    let newUserContacts = flomUsers.slice();
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
      userId,
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

    await updateExistingContacts({ userId, users: newUserContacts });
  } catch (error) {
    throw new Error(error);
  }
}

async function updateExistingContacts({ userId, users }) {
  let usersIds = users.map((user) => user._id.toString());

  let userContacts = await UserContact.find({
    contactId: { $in: usersIds },
    userId,
  });

  let toUpdate = [];

  userContacts.forEach(({ _id, name, contactId }) => {
    let user = users.find((user) => user._id.toString() === contactId);

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

module.exports = { getFlomUsers, syncContacts };
