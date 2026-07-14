const { logger } = require("#infra");
const { Config, Const } = require("#config");
const Utils = require("#utils");
const { Business, BusinessMember, Outlet, Terminal, User } = require("#models");

const actions = [
  "business:view",
  "business:chat",
  "terminals:signin",
  "orders:take",
  "orders:mark_fulfilled",
  "schedules:view",
  "bookings:view",
  "prices:edit",
  "stock:edit",
  "schedules:edit",
  "bookings:edit_fees",
  "bookings:edit",
  "bookings:resolve_no_show",
  "members:invite_helper",
  "members:invite_manager",
  "members:revoke_helper",
  "members:revoke_manager",
  "members:view",
  "business:balance",
  "business:payout",
  "business:profile",
];

const PERMISSIONS = {
  owner: [
    "business:view",
    "business:chat",
    "terminals:signin",
    "orders:take",
    "orders:mark_fulfilled",
    "schedules:view",
    "bookings:view",
    "prices:edit",
    "stock:edit",
    "schedules:edit",
    "bookings:edit_fees",
    "bookings:edit",
    "bookings:resolve_no_show",
    "members:invite_helper",
    "members:invite_manager",
    "members:revoke_helper",
    "members:revoke_manager",
    "members:view",
    "members:change_role",
    "business:balance",
    "business:payout",
    "business:profile",
  ],
  manager: [
    "business:view",
    "business:chat",
    "terminals:signin",
    "orders:take",
    "orders:mark_fulfilled",
    "schedules:view",
    "bookings:view",
    "prices:edit",
    "stock:edit",
    "schedules:edit",
    "bookings:edit_fees",
    "bookings:edit",
    "bookings:resolve_no_show",
    "members:view",
    "members:invite_helper",
    "members:revoke_helper",
  ],
  helper: [
    "business:view",
    "business:chat",
    "terminals:signin",
    "orders:take",
    "orders:mark_fulfilled",
    "schedules:view",
    "bookings:view",
  ],
};

async function checkBusinessPermissions({
  userId,
  business,
  businessId,
  outletId,
  terminalId,
  action,
}) {
  try {
    if (!action || !actions.includes(action)) {
      logger.error("checkBusinessPermissions error: action is required or invalid: " + action);
      return false;
    }

    if (!business) {
      if (outletId) {
        const outlet = await Outlet.findById(outletId).lean();
        businessId = outlet ? outlet.businessId : null;
      } else if (terminalId) {
        const terminal = await Terminal.findById(terminalId).lean();
        businessId = terminal ? terminal.businessId : null;
      }
    }

    const business = await getBusinessById(businessId);

    if (!business) {
      logger.error(
        "checkBusinessPermissions error: business not found: " +
          businessId +
          ", outletId: " +
          outletId +
          ", terminalId: " +
          terminalId,
      );
      return false;
    }

    businessId = business._id.toString();

    const businessMember = await getBusinessMember({ userId, businessId });

    if (!businessMember) {
      logger.error(
        "checkBusinessPermissions error: business member not found, userId: " +
          userId +
          ", businessId: " +
          businessId,
      );
      return false;
    }

    const role = businessMember.role;

    if (!PERMISSIONS[role]) {
      logger.error("checkBusinessPermissions error: role not found in permissions: " + role);
      return false;
    }

    if (!PERMISSIONS[role].includes(action)) {
      logger.error("checkBusinessPermissions error: action not allowed for role");
      return false;
    }

    return true;
  } catch (error) {
    logger.error("checkBusinessPermissions error", error);
    return false;
  }
}

const businessCache = new Map();

async function getBusinessById(businessId) {
  try {
    if (!businessId) {
      logger.error("getBusinessById error: businessId is required");
      return null;
    }

    if (businessCache.has(businessId)) {
      return businessCache.get(businessId);
    }

    const business = await Business.findById(businessId).lean();

    if (!business) {
      logger.error("getBusinessById error: business not found, businessId: " + businessId);
      return null;
    }

    if (businessCache.size > 1000) {
      businessCache.clear();
    }

    businessCache.set(businessId, business);

    return business;
  } catch (error) {
    logger.error("getBusinessById error", error);
    return null;
  }
}

const memberCache = new Map();

async function getBusinessMember({ userId, businessId }) {
  try {
    if (!userId || !businessId) {
      logger.error("getBusinessMember error: userId and businessId are required");
      return null;
    }

    let cacheKey = `${userId}:${businessId}`;

    if (memberCache.has(cacheKey)) {
      return memberCache.get(cacheKey);
    }

    const businessMember = await BusinessMember.findOne({
      businessId,
      userId,
      status: "accepted",
    }).lean();

    if (!businessMember) {
      logger.error(
        "getBusinessMember error: business member not found, userId: " +
          userId +
          ", businessId: " +
          businessId,
      );
      return null;
    }

    if (memberCache.size > 1000) {
      memberCache.clear();
    }

    memberCache.set(cacheKey, businessMember);

    return businessMember;
  } catch (error) {
    logger.error("getBusinessMember error", error);
    return null;
  }
}

module.exports = checkBusinessPermissions;
