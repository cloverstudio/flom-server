function eligibleForUSSD(phoneNumber) {
  if (!phoneNumber.startsWith("+234")) {
    return false;
  }

  if (
    phoneNumber.startsWith("+234809") ||
    phoneNumber.startsWith("+234817") ||
    phoneNumber.startsWith("+234818") ||
    phoneNumber.startsWith("+234909") ||
    phoneNumber.startsWith("+234908") ||
    phoneNumber.startsWith("+234803200") ||
    phoneNumber.startsWith("+234810000")
  ) {
    return false;
  }

  return true;
}

module.exports = eligibleForUSSD;
