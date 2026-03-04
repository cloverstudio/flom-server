const path = require("path");
const fs = require("fs-extra");
const WebP = require("node-webpmux");
const easyimg = require("easyimage");

const { Config } = require("#config");
const getRandomString = require("./getRandomString");

async function handleImageFile(
  file,
  dir = null,
  allowedExtensions = "gif|jpg|jpe|jpeg|png|bmp|ico|webp"
) {
  const originalFilePath = file.path;
  const originalFileName = file.name;

  const tmp = originalFileName.split(".");
  const extension = tmp[tmp.length - 1];
  if (!allowedExtensions.includes(extension)) {
    return { code: 123 };
  }

  let convertedFileName, newFileName, convertedFile;

  dir = !dir ? "" : `${dir}/`;

  if (extension === "webp") {
    const image = new WebP.Image();
    console.log("handleimage1");
    await image.load(originalFilePath);
    convertedFile = { size: file.size, width: image.width, height: image.height };

    convertedFileName = originalFileName;
    newFileName = getRandomString(32);
    console.log("handleimage2");
    const destinationPath = path.resolve(Config.uploadPath, `${dir}${newFileName}.webp`);
    console.log("handleimage3");
    await fs.copyFile(originalFilePath, destinationPath);
    console.log("handleimage4");
    fs.unlinkSync(originalFilePath);
    console.log("handleimage5");
  } else {
    console.log("handleimage6 nebi trebo bit");
    newFileName = getRandomString(32);
    const convertedFilePath = path.resolve(Config.uploadPath, `${dir}${newFileName}.webp`);
    convertedFileName = `${newFileName}.webp`;

    convertedFile = await easyimg.convert({
      src: originalFilePath,
      dst: convertedFilePath,
    });
    fs.unlinkSync(originalFilePath);
  }

  const fileData = {
    originalFileName: convertedFileName,
    nameOnServer: `${newFileName}.webp`,
    mimeType: "image/webp",
    size: convertedFile.size,
    height: convertedFile.height,
    width: convertedFile.width,
    aspectRatio: convertedFile.height / convertedFile.width,
  };

  return { fileData, code: 1 };
}

module.exports = handleImageFile;
