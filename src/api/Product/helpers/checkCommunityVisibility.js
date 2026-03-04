const { Const } = require("#config");
const Utils = require("#utils");
const { Membership } = require("#models");

async function checkCommunityVisibility({ communityIds }) {
  const checkedCommunityIds = communityIds.filter((id) => Utils.isValidObjectId(id));

  if (checkedCommunityIds.length !== communityIds.length) {
    return {
      code: Const.responsecodeInvalidMembershipId,
      message: "one or more invalid community ids",
    };
  }

  const communities = await Membership.find({ _id: { $in: communityIds } }).lean();

  if (communityIds.length !== communities.length) {
    return {
      code: Const.responsecodeMembershipNotFound,
      message: "one or more communities not found",
    };
  }
}

module.exports = checkCommunityVisibility;
