const easyimg = require("easyimage");
const { Config } = require("#config");
const roundNumber = require("./roundNumber");

async function generateImageThumbnail(newFile, newFileName, thumbFileName) {
  try {
    newFile.thumbName = thumbFileName;
    const { height, width } = await easyimg.info(Config.uploadPath + "/" + newFileName);
    const ratio = width / height;

    let newHeight, newWidth;

    if (ratio < 1) {
      // portrate width = 640
      newWidth = 640;
      newHeight = newWidth / ratio;
    } else if (ratio > 1) {
      // landscape height = 640
      newHeight = 640;
      newWidth = newHeight * ratio;
    } else {
      // square
      newWidth = 640;
      newHeight = 640;
    }

    const destPathTmp = Config.uploadPath + "/" + thumbFileName;

    let image = await easyimg.thumbnail({
      src: Config.uploadPath + "/" + newFileName,
      dst: destPathTmp + ".jpg",
      width: newWidth,
      height: newHeight,
    });

    return {
      image,
      destPathTmp,
      originalRatio: roundNumber(ratio, 5),
    };
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("thumbnail creation failed");
  }
}

module.exports = generateImageThumbnail;
