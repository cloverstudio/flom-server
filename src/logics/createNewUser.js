const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User } = require("#models");
const { recombee } = require("#services");

async function createNewUser(userData, raw) {
  try {
    const {
      phoneNumber,
      activationCode,
      ref,
      isAppUser,
      typeAcc,
      merchantCode,
      shadow,
      phoneNumberStatus,
      deviceType,
      rates,
      latitude,
      longitude,
    } = userData;
    const user = new User();

    user.name = `Flomer_${user._id.toString()}`;
    user.organizationId = Const.organizationId;
    user.status = 1;
    user.groups = [Const.groupId];
    user.created = Date.now();
    user.phoneNumber = phoneNumber;
    user.userName = `Flomer_${user._id.toString()}`;
    user.countryCode = Utils.getCountryCodeFromPhoneNumber({ phoneNumber });
    if (user.countryCode && rates)
      user.currency = Utils.getCurrencyFromCountryCode({ countryCode: user.countryCode, rates });
    user.phoneNumberStatus = phoneNumberStatus;
    user.deviceType = deviceType;
    user.followedBusinesses = [Config.flomSupportUserId];

    let stringExists = false;
    const regexTerminalCode = /[^0-9]/g;

    do {
      const randomString = Utils.getRandomString(8).toLowerCase();

      const lnRegex = new RegExp(`^${randomString}$`, "i");
      const alreadyExists = await User.findOne({
        $or: [{ lightningUserName: lnRegex }, { userName: lnRegex }],
      }).lean();
      if (alreadyExists) {
        stringExists = true;
      } else if (!randomString.match(regexTerminalCode)) {
        stringExists = true;
      } else {
        user.lightningUserName = randomString;
        stringExists = false;
      }
    } while (stringExists);

    if (activationCode) {
      user.activationCode = activationCode;
    }

    if (merchantCode) {
      user.bankAccounts = [{ merchantCode }];
    }

    if (ref) {
      user.ref = ref;
    }

    if (shadow) {
      user.shadow = true;
    }

    if (typeAcc) {
      user.typeAcc = typeAcc;
    }

    if (typeof isAppUser !== "undefined") {
      user.isAppUser = isAppUser;
    }

    if (latitude && longitude) {
      user.location = { type: "Point", coordinates: [longitude, latitude] };
    }

    await user.save();
    await recombee.upsertUser(user.toObject());

    console.log(
      `===============\n New user created!\n Phone number: ${phoneNumber}\n activation code ${activationCode}\n ===============`,
    );

    return raw ? user : user.toObject();
  } catch (error) {
    console.log(JSON.stringify(error));
    throw new Error("createNewUser error");
  }
}

module.exports = createNewUser;
