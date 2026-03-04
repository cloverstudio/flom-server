const { Tribe } = require("#models");

async function isUserTribeMember({ productTribeIds, userId }) {
  try {
    if (!productTribeIds || productTribeIds.length < 1) {
      return false;
    }
    const filteredTribeIds = productTribeIds.filter((id) => id !== "");
    const productTribes = await Tribe.find({ _id: { $in: filteredTribeIds } }).lean();
    if (_.isEmpty(productTribes)) return false;
    for (let i = 0; i < productTribes.length; i++) {
      if (userId === productTribes[i].ownerId) {
        return true;
      }
      for (let j = 0; j < productTribes[i].members.accepted.length; j++) {
        if (userId === productTribes[i].members.accepted[j].id) return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error in API call to check if user is product tribe member.");
    console.error(error);
  }
}

module.exports = isUserTribeMember;
