const easyimg = require("easyimage");
const { Config } = require("#config");

async function generateThumbnailFromImage(fileName) {
  try {
    const path = `${Config.uploadPath}/${fileName}`;

    const { width, height } = await easyimg.info(path);
    const ratio = width / height;
    let newWidth,
      newHeight,
      minSize = 640;

    if (ratio < 1) {
      newWidth = minSize;
      newHeight = newWidth / ratio;
    } else if (ratio > 1) {
      newHeight = minSize;
      newWidth = newHeight * ratio;
    } else {
      newWidth = minSize;
      newHeight = minSize;
    }

    const thumbnailName = `thumb_${fileName.replace("upload_", "")}`;

    await easyimg.thumbnail({
      src: path,
      dst: `${Config.uploadPath}/${thumbnailName}`,
      width: newWidth,
      height: newHeight,
    });

    return thumbnailName;
  } catch (error) {
    console.error(error);
    return Promise.reject("generate thumbnail failed");
  }
}

module.exports = generateThumbnailFromImage;
