const { Category } = require("#models");

async function syncProductsCategories(product) {
  try {
    if (product.categoryId && !product.productMainCategoryId) {
      let cat = await Category.findOne({ _id: product.categoryId });
      if (cat.parentId == "-1") {
        let mainCat = await Category.findOne({ name: cat.name });
        product.productMainCategoryId = mainCat._id.toString();
      } else {
        let parentCat = await Category.findOne({ _id: cat.parentId });
        let mainCat = await Category.findOne({ name: parentCat.name });
        let subCat = await Category.findOne({ name: cat.name });
        product.productMainCategoryId = mainCat._id.toString();
        product.productSubCategoryId = subCat._id.toString();
      }
    } else if (product.productMainCategoryId) {
      let mainCat = await Category.findOne({ _id: product.productMainCategoryId });
      if (product.productSubCategoryId) {
        let subCat = await Category.findOne({ _id: product.productSubCategoryId });
        if (mainCat.name == "Buy and Sell") {
          mainCat = await Category.findOne({ _id: subCat.mainCategoryId });
          product.productMainCategoryId = mainCat._id;
        }
        let parentCat = await Category.findOne({ name: mainCat.name, parentId: "-1" });
        let cat = await Category.findOne({
          name: subCat.name,
          parentId: parentCat._id.toString(),
        });
        if (!cat) {
          let newCat = await Category.findOne({ name: "Default" });
          let oldCat = await Category.findOne({ name: "Default", parentId: "-1" });
          product.categoryId = oldCat._id;
          product.productMainCategoryId = newCat._id;
          product.productSubCategoryId = undefined;
        } else {
          product.categoryId = cat._id;
        }
      } else {
        let cat = await Category.findOne({ name: mainCat.name, parentId: "-1" });
        product.categoryId = cat._id;
      }
    }
    return product;
  } catch (error) {
    console.log(error);
  }
}

module.exports = syncProductsCategories;
