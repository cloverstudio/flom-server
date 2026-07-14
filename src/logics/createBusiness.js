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

    const business = await Business.create({
      owner: { _id: owner._id.toString(), phoneNumber: owner.phoneNumber },
      ...info,
    });

    const businessObj = await business.toObject();

    await User.updateOne({ _id: owner._id.toString() }, { hasBusiness: true });

    let businessMember = await BusinessMember.create({
      businessId: business._id.toString(),
      userId: owner._id.toString(),
      role: "owner",
      status: "accepted",
    });
    businessMember = await businessMember.toObject();
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
      isMainTerminal: true,
      paymentAddress,
    });
    terminal = await terminal.toObject();
    businessObj.terminals = [terminal];

    await TerminalOperatorReference.create({
      businessId: business._id.toString(),
      outletId: outlet._id.toString(),
      chainId: chain._id.toString(),
      subChainId: subChain._id.toString(),
      terminalId: terminal._id.toString(),
      userId: owner._id.toString(),
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

  let paymentAddress = owner.phoneNumber;
  paymentAddress = paymentAddress.replace("+" + country.phone, "");
  if (paymentAddress.startsWith("0")) {
    paymentAddress = paymentAddress.slice(1);
  }
  paymentAddress = paymentAddress.slice(0, 10);

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

module.exports = createBusiness;
