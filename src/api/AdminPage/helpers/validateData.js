const bcrypt = require("bcrypt");
const { Config, Const } = require("#config");
const Utils = require("#utils");
const { AdminPageUser } = require("#models");

async function validateAndGetUser(userId) {
  if (!userId) {
    return {
      code: Const.responsecodeNoUserId,
      message: "no userId",
    };
  }
  if (!Utils.isValidObjectId(userId)) {
    return {
      code: Const.responsecodeNotValidId,
      message: "userId is not a valid id",
    };
  }
  const user = await AdminPageUser.findOne({ _id: userId });
  if (!user) {
    return {
      code: Const.responsecodeUserNotFound,
      message: "user not found",
    };
  }
  return { user };
}

async function validateAndUpdateUserData({
  user,
  username,
  password,
  email,
  firstName,
  lastName,
  phoneNumber,
  bvn,
  address,
  socialMedia,
  role,
  requestUserRole,
  sendVerificationEmail,
}) {
  if (username && username !== "" && user.username !== username) {
    const regex = RegExp("([a-zA-Z0-9]|-|_|~)");
    const usernameCharacters = username.split("");
    for (let i = 0; i < usernameCharacters.length; i++) {
      if (!regex.test(usernameCharacters[i])) {
        return {
          code: Const.responsecodeWrongUsername,
          message: "invalid characters",
        };
      }
    }

    const usernameTaken = await AdminPageUser.findOne({ username }).lean();
    if (usernameTaken) {
      if (
        usernameTaken.emailVerification.verified ||
        usernameTaken.created + Config.usernameProtectionPeriod > Date.now()
      ) {
        return {
          code: Const.responsecodeProfileUsernameTaken,
          message: "username taken",
        };
      }
    }
    user.username = username;
  }
  if (password && password !== "") {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return {
        code: Const.responsecodeInvalidPassword,
        message: "invalid password",
      };
    }
    const hashedPassword = await bcrypt.hash(password, Config.saltRounds);
    user.password = hashedPassword;
  }

  if (email && email !== "" && email !== user.email) {
    user.email = email;
    const { emailCode, emailToken } = sendVerificationEmail({ email: user.email });

    user.emailVerification.verified = false;
    user.emailVerification.code = emailCode;
    user.emailVerification.token = emailToken;
    user.emailVerification.emailOut = Date.now();
  }
  if (firstName && firstName !== "" && user.firstName !== firstName) {
    user.firstName = firstName;
  }
  if (lastName && lastName !== "" && user.lastName !== lastName) {
    user.lastName = lastName;
  }
  if (phoneNumber && phoneNumber !== "" && user.phoneNumber !== phoneNumber) {
    user.phoneNumber = phoneNumber;
  }
  if ((bvn || bvn === "") && user.bvn !== bvn) {
    user.bvn = bvn;
  }
  if (address && address !== "" && user.address !== address) {
    user.address = address;
  }
  if (socialMedia && socialMedia.length >= 0 && user.socialMedia !== socialMedia) {
    user.socialMedia = socialMedia;
  }
  if (
    role &&
    role !== "" &&
    !isNaN(+role) &&
    Const.adminPageRoles.indexOf(+role) !== -1 &&
    role < requestUserRole
  ) {
    user.role = +role;
  }

  await user.save();

  const { _id: id, password: usersPassword, token, __v, ...rest } = user.toObject();

  return { user: { id, ...rest } };
}

module.exports = { validateAndGetUser, validateAndUpdateUserData };
