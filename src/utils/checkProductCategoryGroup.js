const { Const } = require("#config");

async function checkProductCategoryGroup({ productType, categoryGroups }) {
  if (categoryGroups.includes(Const.categoryGroupAll)) {
    return true;
  }

  if (
    productType === Const.productTypeProduct &&
    categoryGroups.includes(Const.categoryGroupMerchants)
  ) {
    return true;
  }

  if (
    productType !== Const.productTypeProduct &&
    categoryGroups.includes(Const.categoryGroupCreators)
  ) {
    return true;
  }

  switch (productType) {
    case Const.productTypeVideo:
      if (categoryGroups.includes(Const.categoryGroupVideo)) {
        return true;
      }
      break;
    case Const.productTypeVideoStory:
      if (categoryGroups.includes(Const.categoryGroupVideoStory)) {
        return true;
      }
      break;
    case Const.productTypePodcast:
      if (categoryGroups.includes(Const.categoryGroupPodcast)) {
        return true;
      }
      break;
    case Const.productTypeTextStory:
      if (categoryGroups.includes(Const.categoryGroupTextStory)) {
        return true;
      }
      break;
    case Const.productTypeProduct:
      if (categoryGroups.includes(Const.categoryGroupProduct)) {
        return true;
      }
      break;
  }
  return false;
}

module.exports = checkProductCategoryGroup;
