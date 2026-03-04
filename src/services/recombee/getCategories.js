const { Category } = require("#models");

const categories = {};

async function getCategories() {
  if (Object.keys(categories).length === 0) {
    const cats = await Category.find();
    cats.forEach((cat) => {
      categories[cat._id.toString()] = cat.name;
    });
  }

  return categories;
}

module.exports = getCategories;
