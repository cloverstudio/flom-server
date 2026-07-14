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
      if (businessId) {
        business = await Business.findOne({ _id: businessId }).lean();
      } else if (outletId) {
        const outlet = await Outlet.findOne({ _id: outletId }).lean();
        if (outlet) {
          business = await Business.findOne({ _id: outlet.businessId }).lean();
        }
      } else if (terminalId) {
        const terminal = await Terminal.findOne({ _id: terminalId }).lean();
        if (terminal) {
          business = await Business.findOne({ _id: terminal.businessId }).lean();
        }
      }
    }

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

    const businessMember = await BusinessMember.findOne({
      businessId,
      userId,
      status: "accepted",
    }).lean();

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

module.exports = checkBusinessPermissions;
