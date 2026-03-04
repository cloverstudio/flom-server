const { Config, Const } = require("#config");
const Utils = require("#utils");

function sendResetPasswordEmail({ email }) {
  const token = Utils.getRandomString(Const.resetPasswordTokenLength);
  const tokenGeneratedAt = Date.now();

  Utils.sendEmailWithSG(
    "Password Reset",
    `Flom Admin page Password Reset\n\n` +
      `There was a request to reset your password. The password reset window is limited to 3 hours.\n\n` +
      `If you do not reset password within 3 hours, you will need to submit new request to reset your password.\n\n` +
      `To complete the password reset process, visit the following link:\n\n` +
      `${Config.adminPageUrl}/auth/password-reset/${token}`,
    email
  );
  return { token, tokenGeneratedAt };
}

function sendVerificationEmail({ email }) {
  const emailCode = Utils.generateRandomNumber(6).toString();
  const emailToken = Utils.getRandomString(20);

  Utils.sendEmailWithSG(
    "Admin page email verification code",
    `Your admin page verification code is ${emailCode}.\nAlternatively, to verify your email address you can use this link\n` +
      `${Config.adminPageUrl}/auth/sign-up/verification-by-url/${emailToken}`,
    email
  );
  return { emailCode, emailToken };
}

module.exports = { sendResetPasswordEmail, sendVerificationEmail };
