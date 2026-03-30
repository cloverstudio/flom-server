const { Const } = require("#config");

const requiredParameters = {
  1: { name: true, description: true },
  2: { name: true, description: false },
  3: { name: true, description: false },
  4: { name: true, description: true },
  5: { name: true, description: true, categoryId: true, originalPrice: true },
};

const errors = {
  name: { code: Const.responsecodeProductNoProductName, message: "no product name" },
  description: { code: Const.responsecodeProductNoProductDescription, message: "no description" },
  categoryId: {
    code: Const.responsecodeProductNoProductCategoryId,
    message: "no product categoryId",
  },
  price: { code: Const.responsecodeProductNoProductPrice, message: "no product price" },
  file: { code: Const.responsecodeInvalidFile, message: `invalid or no file` },
};

function checkDraftProduct(product) {
  const productObj = product.toObject();

  const productRequiredParameters = requiredParameters[productObj.type];
  const parametersToCheck = Object.keys(productRequiredParameters);

  for (let i = 0; i < parametersToCheck.length; i++) {
    const parameter = parametersToCheck[i];
    if (productRequiredParameters[parameter] && !productObj[parameter]) {
      return errors[parameter];
    }
  }

  let hasImage = false,
    hasVideo = false,
    hasAudio = false;
  for (let i = 0; i < productObj.file.length; i++) {
    const file = productObj.file[i];
    switch (file.fileType) {
      case Const.fileTypeImage:
        hasImage = true;
        break;
      case Const.fileTypeVideo:
        hasVideo = true;
        break;
      case Const.fileTypeAudio:
        hasAudio = true;
        break;
    }
  }

  //check if correct files have been added for each product type
  const { type } = productObj;

  if (
    !(
      (type === Const.productTypeVideo && hasVideo && !hasImage && !hasAudio) ||
      (type === Const.productTypeVideoStory && hasVideo && !hasImage && !hasAudio) ||
      (type === Const.productTypePodcast && hasAudio && !hasVideo) ||
      (type === Const.productTypeTextStory && !hasAudio && !hasVideo) ||
      (type === Const.productTypeProduct && !hasAudio)
    )
  ) {
    return errors["file"];
  }
}

module.exports = checkDraftProduct;
