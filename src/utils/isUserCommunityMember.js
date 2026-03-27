const { Membership, User } = require("#models");

async function isUserCommunityMember({ productCommunityIds, userId }) {
  try {
    const user = await User.findOne({ _id: userId }).lean();

    if (!productCommunityIds || productCommunityIds.length < 1) {
      return false;
    }
    const filteredCommunityIds = productCommunityIds.filter((id) => id !== "");
    const productCommunities = await Membership.find({ _id: { $in: filteredCommunityIds } }).lean();
    if (!productCommunities || productCommunities.length === 0) return false;
    for (let i = 0; i < productCommunities.length; i++) {
      if (userId === productCommunities[i].creatorId) {
        return true;
      }
    }
    for (let j = 0; j < filteredCommunityIds.length; j++) {
      for (let k = 0; k < user.memberships.length; k++) {
        if (user.memberships[k].id === filteredCommunityIds[j]) return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error in API call to check if user is product community member.");
    console.error(error);
  }
}

module.exports = isUserCommunityMember;
