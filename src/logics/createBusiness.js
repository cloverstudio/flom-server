const { logger } = require("#infra");
const { Config, Const, countries } = require("#config");
const Utils = require("#utils");
const {
  Business,
  BusinessMember,
  Chain,
  SubChain,
  Outlet,
  Terminal,
  TerminalOperatorReference,
  User,
  IdApplication,
  MerchantApplication,
} = require("#models");

async function createBusiness({ owner, info }) {
  try {
    const chain = await Chain.create({ ownerId: owner._id.toString() });
    const subChain = await SubChain.create({
      chainId: chain._id.toString(),
      ownerId: owner._id.toString(),
    });

    info.chainId = chain._id.toString();
    info.subChainId = subChain._id.toString();

    const { payoutStatus, idStatus } = await getBusinessStatuses({ owner });

    const business = await Business.create({
      owner: { _id: owner._id.toString(), phoneNumber: owner.phoneNumber },
      ...(payoutStatus && { payoutStatus }),
      ...(idStatus && { idStatus }),
      ...info,
    });

    const businessObj = await business.toObject();

    await User.updateOne({ _id: owner._id.toString() }, { hasBusiness: true });

    let businessMember = await BusinessMember.create({
      businessId: business._id.toString(),
      userId: owner._id.toString(),
      role: "owner",
      status: "active",
    });
    businessMember = await businessMember.toObject();

    const user = await User.findById(
      owner._id.toString(),
      { _id: 1, name: 1, userName: 1, phoneNumber: 1, avatar: 1, created: 1 },
      { lean: true },
    );

    businessMember.user = user;

    businessObj.members = [businessMember];

    let location = null;

    if (
      owner.location &&
      owner.location.coordinates &&
      owner.location.coordinates[0] &&
      owner.location.coordinates[0] !== 0 &&
      owner.location.coordinates[1] &&
      owner.location.coordinates[1] !== 0
    ) {
      location = owner.location;
    }

    let address = null;

    if (owner.address) {
      address = owner.address;
    }

    let outlet = await Outlet.create({
      businessId: business._id.toString(),
      chainId: chain._id.toString(),
      subChainId: subChain._id.toString(),
      name: "Main Outlet",
      isMainOutlet: true,
      location,
      address,
    });
    outlet = await outlet.toObject();
    businessObj.outlets = [outlet];

    let paymentAddress = await createTerminalPaymentAddress(owner);

    let terminal = await Terminal.create({
      businessId: business._id.toString(),
      outletId: outlet._id.toString(),
      chainId: chain._id.toString(),
      subChainId: subChain._id.toString(),
      paymentAddress,
    });
    terminal = await terminal.toObject();
    businessObj.outlets[0].terminals = [terminal];

    await TerminalOperatorReference.create({
      businessId: business._id.toString(),
      outletId: outlet._id.toString(),
      chainId: chain._id.toString(),
      subChainId: subChain._id.toString(),
      terminalId: terminal._id.toString(),
      userId: owner._id.toString(),
      startTimeStamp: Date.now(),
    });

    return businessObj;
  } catch (error) {
    logger.error("Error in createBusiness:", error);
  }
}

async function createTerminalPaymentAddress(owner) {
  const country = countries[owner.countryCode];
  if (!country) {
    throw new Error(`Country not found for code: ${owner.countryCode}`);
  }

  let paymentAddress = owner.whatsApp?.businessPhoneNumber;

  if (paymentAddress) {
    paymentAddress = paymentAddress.replace("+" + country.phone, "");
    if (paymentAddress.startsWith("0")) {
      paymentAddress = paymentAddress.slice(1);
    }
    paymentAddress = paymentAddress.slice(0, 10);
  } else {
    paymentAddress = Utils.generateRandomNumber(10);
  }

  let addressExists = false;

  do {
    const existingTerminal = await Terminal.findOne({
      paymentAddress: paymentAddress,
    });
    addressExists = !!existingTerminal;
    if (addressExists) {
      paymentAddress = Utils.generateRandomNumber(10);
    }
  } while (addressExists);

  return paymentAddress;
}

async function getBusinessStatuses({ owner }) {
  const mArr = await MerchantApplication.find({ userId: owner._id.toString() })
    .sort({ created: -1 })
    .limit(1)
    .lean();
  const iArr = await IdApplication.find({ userId: owner._id.toString() })
    .sort({ created: -1 })
    .limit(1)
    .lean();
  const m = mArr[0];
  const i = iArr[0];

  let payoutStatus = null;
  let idStatus = null;
  let idRejectionReason = null;

  if (i) {
    switch (i.approvalStatus) {
      case Const.idApplicationStatusPending:
        idStatus = "pending";
        break;
      case Const.idApplicationStatusRejected:
        idStatus = "rejected";
        idRejectionReason = i.approvalComment;
        break;
      case Const.idApplicationStatusApproved:
        idStatus = "verified";
        break;
    }
  }
  if (m) {
    switch (m.approvalStatus) {
      case Const.merchantApplicationStatusPending:
        payoutStatus = "disabled";
        idStatus = "pending";
        break;
      case Const.merchantApplicationStatusRejected:
        payoutStatus = "disabled";
        idStatus = "rejected";
        idRejectionReason = m.approvalComment;
        break;
      case Const.merchantApplicationStatusApprovedWithoutPayout:
        payoutStatus = "disabled";
        idStatus = "verified";
        break;
      case Const.merchantApplicationStatusPendingPaypalSent:
        payoutStatus = "disabled";
        idStatus = "pending";
        break;
      case Const.merchantApplicationStatusPendingPaypalReceived:
        payoutStatus = "disabled";
        idStatus = "pending";
        break;
      case Const.merchantApplicationStatusApprovedWithPayout:
        payoutStatus = "enabled";
        idStatus = "verified";
        break;
      case Const.merchantApplicationStatusPendingPaypalEmailAdded:
        payoutStatus = "disabled";
        idStatus = "pending";
        break;
    }
  }

  return { payoutStatus, idStatus, idRejectionReason };
}

module.exports = createBusiness;
