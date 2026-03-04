const { Const } = require("#config");
const Utils = require("#utils");
const { Tribe } = require("#models");

async function checkTribeVisibility({ tribeIds, requestUserId }) {
  const checkedTribeIds = tribeIds.filter((id) => Utils.isValidObjectId(id));

  if (checkedTribeIds.length !== tribeIds.length) {
    return { code: Const.responsecodeTribeBadId, message: "one or more invalid tribe ids" };
  }

  const tribes = await Tribe.find(
    { _id: { $in: tribeIds } },
    { _id: 1, ownerId: 1, members: 1 },
  ).lean();

  if (tribeIds.length !== tribes.length) {
    return { code: Const.responsecodeTribeNotFound, message: "one or more tribes not found" };
  }

  for (const tribe of tribes) {
    if (tribe.ownerId === requestUserId) {
      continue;
    }

    const member = tribe.members.accepted.find((member) => member.id === requestUserId);
    if (!member || member.role < Const.tribeMemberRoleElder) {
      return {
        code: Const.responsecodeTribeUnauthorized,
        message: "user not authorized for one or more tribes",
      };
    }
  }
}

module.exports = checkTribeVisibility;
