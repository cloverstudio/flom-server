const sharp = require("sharp");

async function resizeImage(src, dst, width, height, quality = 100, ignoreAspectRatio = false) {
  /*const resizedImage = await easyimg.resize({
      src,
      dst,
      width,
      height,
      quality,
      ignoreAspectRatio,
      coalesce: true,
    });*/
  //console.log("resizedImage ", resizedImage);
  console.log("src, dst, width, height ", src, dst, width, height);

  const sharpImage = sharp(src, { animated: true, pages: -1 }); // supports animated gif and webp images
  const imageMeta = await sharpImage.metadata();
  const { width: width1, size, loop, pages, pageHeight, delay } = imageMeta;
  console.log("imageMeta ", imageMeta);

  const resized = sharpImage.resize({
    width: width,
    height: height,
    fit: sharp.fit.contain,
  });
  console.log("resized ", resized);

  const resizedImage = await resized.toFile(dst);
  console.log("resizedImage before height change ", resizedImage);

  const realHeight = resizedImage.height / (pages || 1);
  console.log("realHeight ", realHeight);

  resizedImage.height = realHeight;
  console.log("resizedImage after height change ", resizedImage);
  return resizedImage;
}

module.exports = resizeImage;
