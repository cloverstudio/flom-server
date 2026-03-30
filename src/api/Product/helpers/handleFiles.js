const { Const, Config } = require("#config");
const Utils = require("#utils");
const fs = require("fs-extra");
const fsp = require("fs/promises");
const sharp = require("sharp");
const mediaHandler = require("#media");

async function handleVideoFile(file) {
  try {
    //NOTE add file extension to the name when implementing to New Flom
    const { newName = null, newThumbName = null, newHslName = null } = file;

    let tempPath = file.path;
    const fileName = file.name;
    const fileMimeType = file.type;
    const destPath = Config.uploadPath + "/";
    const newFileName = newName ?? Utils.getRandomString(32);
    const thumbFileName = newThumbName ?? Utils.getRandomString(32);
    const hslName = newHslName ?? Utils.getRandomString(32);
    const fileData = {
      file: {
        originalName: fileName,
        nameOnServer: newFileName + "." + "mp4",
      },
      webm_av1_sd: { originalName: fileName, nameOnServer: newFileName + "_av1_sd.webm" },
    };
    console.log(fileName, fileMimeType, file.size, tempPath);

    let dur;

    try {
      const inputMetadata = await mediaHandler.getMediaInfo(tempPath);
      console.log("handleVideoFile, original file metadata: " + JSON.stringify(inputMetadata));

      dur = inputMetadata.duration;
    } catch (error) {
      console.error("handleVideoFile, original file metadata", error);
    }

    let keyFramesList = "2,6,10",
      segmentTimesList = "1,5,9";

    const repeatFactor = dur > 10 ? Math.ceil((dur - 10) / 10) : 0;
    for (let i = 1; i <= repeatFactor; i++) {
      keyFramesList += `,${i * 10 + 10}`;
      segmentTimesList += `,${i * 10 + 9}`;
    }

    await Utils.compressVideo({
      originalFilePath: tempPath,
      destinationPath: destPath,
      newFileName,
      keyFramesList,
    });

    const originalVideoMetadata = await mediaHandler.getMediaInfo(
      destPath + newFileName + "_compressed.mp4",
    );
    fileData.file.width = originalVideoMetadata.width;
    fileData.file.height = originalVideoMetadata.height;
    fileData.webm_av1_sd.width = originalVideoMetadata.width;
    fileData.webm_av1_sd.height = originalVideoMetadata.height;
    let rotation = originalVideoMetadata.rotation;
    if (rotation) {
      //await Utils.rotateVideo(tempPath, destPath + newFileName + ".mp4", rotation);
      await Utils.rotateVideo(
        destPath + newFileName + "_compressed.mp4",
        destPath + newFileName + ".mp4",
        rotation,
      );
    } else {
      //await fsp.copyFile(tempPath, destPath + newFileName + ".mp4");
      await fsp.copyFile(
        destPath + newFileName + "_compressed.mp4",
        destPath + newFileName + ".mp4",
      );
    }

    //file is already rotated and copied to the right place with new name so it can be deleted

    await fsp.unlink(destPath + newFileName + "_compressed.mp4");

    let convertToHslSuccess = false;
    try {
      await Utils.convertToHSL(
        destPath + newFileName + ".mp4",
        destPath + hslName,
        segmentTimesList,
      );
      convertToHslSuccess = true;
    } catch (error) {
      convertToHslSuccess = false;
    }

    let convertToDashSuccess = false;
    try {
      await Utils.convertToDash(
        destPath + newFileName + "_av1_sd.webm",
        destPath + hslName + ".mpd",
        hslName,
      );
      convertToDashSuccess = true;
    } catch (error) {
      convertToDashSuccess = false;
    }

    const metadata = await mediaHandler.getMediaInfo(destPath + newFileName + ".mp4");
    const aspectRatio = Utils.roundNumber(metadata.width / metadata.height, 5);

    fileData.fileType = Const.fileTypeVideo;
    fileData.file.aspectRatio = aspectRatio;
    fileData.file.duration = Utils.roundNumber(metadata.duration, 6);
    fileData.file.mimeType = fileMimeType;
    fileData.file.size = metadata.size;
    fileData.file.hslName = convertToHslSuccess ? hslName : "";

    const webmMetadata = await mediaHandler.getMediaInfo(destPath + newFileName + "_av1_sd.webm");

    fileData.webm_av1_sd.aspectRatio = aspectRatio;
    fileData.webm_av1_sd.duration = fileData.file.duration;
    fileData.webm_av1_sd.mimeType = "video/webm";
    fileData.webm_av1_sd.size = webmMetadata.size;
    fileData.webm_av1_sd.dashName = convertToDashSuccess ? hslName + ".mpd" : "";

    const videoThumbnail = await Utils.getVideoScreenshots(
      destPath,
      thumbFileName,
      newFileName,
      fileData.file.duration,
    );

    fileData.thumb = {
      originalName: fileName,
      nameOnServer: thumbFileName + ".jpg",
      mimeType: "image/jpeg",
      size: videoThumbnail.thumbSize,
    };
    return fileData;
  } catch (error) {
    console.error(error);
    throw new Error("Error in handleVideoFile");
  }
}

async function handleImageFile(file) {
  try {
    //NOTE add file extension to the name when implementing to New Flom
    const tempPath = file.path;
    const fileName = file.name;

    if (fileName.endsWith(".webp")) {
      const fileData = await handleWebp(file);
      return fileData;
    }

    const { newName = null, newThumbName = null } = file;

    const destPath = Config.uploadPath + "/";
    const newFileName = newName ?? Utils.getRandomString(32);
    const thumbFileName = newThumbName ?? Utils.getRandomString(32);
    const fileData = {
      file: {
        originalName: fileName,
        nameOnServer: newFileName + ".jpg",
      },
    };

    const dimensions = await sharp(tempPath).metadata();
    fileData.file.width = dimensions.width;
    fileData.file.height = dimensions.height;

    console.log("dimensions", dimensions);

    await fsp.copyFile(tempPath, destPath + newFileName);

    await sharp(tempPath).toFile(destPath + newFileName + ".jpg");

    //await rename(destPath + newFileName + ".jpg", destPath + newFileName);

    let newFile = fs.statSync(destPath + newFileName);
    const { image, destPathTmp, originalRatio } = await Utils.generateImageThumbnail(
      newFile,
      newFileName,
      thumbFileName,
    );

    fileData.fileType = Const.fileTypeImage;
    fileData.file.size = newFile.size;
    fileData.file.mimeType = "image/jpeg";
    fileData.file.aspectRatio = originalRatio;

    await fsp.unlink(destPath + newFileName);
    fileData.thumb = {
      originalName: fileName,
      nameOnServer: thumbFileName + ".jpg",
      mimeType: "image/jpeg",
      size: image.size,
    };
    return fileData;
  } catch (error) {
    console.error(error);
    throw new Error("Error in handleImageFile");
  }
}

async function handleWebp(file) {
  const { newName = null, newThumbName = null } = file;

  const tempPath = file.path;
  const fileName = file.name;
  const destPath = Config.uploadPath + "/";
  const newFileName = newName ?? Utils.getRandomString(32);
  const thumbFileName = newThumbName ?? Utils.getRandomString(32);

  const meta = await sharp(tempPath, { animated: true }).metadata();
  const width = meta.width;
  const height = meta.pageHeight ?? meta.height;
  // const pages = !meta.pages ? 1 : meta.pages;
  const aspectRatio = Utils.roundNumber(width / height, 5);

  const fileData = {
    file: {
      originalName: fileName,
      nameOnServer: newFileName + ".webp",
      mimeType: "image/webp",
      width,
      height,
      size: file.size,
      aspectRatio,
    },
    fileType: Const.fileTypeImage,
  };

  await fsp.copyFile(tempPath, destPath + newFileName + ".webp");

  let newWidth, newHeight;
  if (width > 640 && width > height) {
    newWidth = 640;
    newHeight = Math.round(newWidth / aspectRatio);
  } else if (height > 640 && height > width) {
    newHeight = 640;
    newWidth = Math.round(newHeight * aspectRatio);
  } else {
    newHeight = height > 640 ? 640 : height;
    newWidth = width > 640 ? 640 : width;
  }

  await sharp(tempPath, { animated: true })
    .resize({ height: newHeight, width: newWidth })
    .toFile(destPath + thumbFileName + ".webp");

  const thumbData = fs.statSync(destPath + thumbFileName + ".webp");

  fileData.thumb = {
    originalName: fileName,
    nameOnServer: thumbFileName + ".webp",
    mimeType: "image/webp",
    size: thumbData.size,
    width: newWidth,
    height: newHeight,
  };

  return fileData;
}

async function handleAudioFile(file) {
  try {
    //NOTE add file extension to the name when implementing to New Flom
    const { newName = null, newHslName = null } = file;

    const tempPath = file.path;
    const fileName = file.name;
    const fileMimeType = file.type;
    const destPath = Config.uploadPath + "/";
    const newFileName = newName ?? Utils.getRandomString(32);
    const hslName = newHslName ?? Utils.getRandomString(32);
    const fileData = {
      file: {
        originalName: fileName,
        nameOnServer: newFileName + ".mp3",
      },
    };

    const newAudioDestPath = destPath + newFileName + ".mp3";

    if (fileMimeType !== "audio/mpeg") {
      let extension;
      switch (fileMimeType) {
        case "audio/aac":
          extension = ".aac";
          break;
        case "audio/x-aac":
          extension = ".aac";
          break;
        case "audio/wav":
        case "audio/x-wav":
          extension = ".wav";
          break;
        case "audio/ogg":
          extension = ".ogg";
          break;
        case "audio/flac":
          extension = ".flac";
          break;
        default:
          throw new Error("Unsupported audio format");
      }
      await fsp.copyFile(tempPath, destPath + newFileName + extension);
      await Utils.convertToMP3(tempPath, newAudioDestPath);
      await fs.remove(destPath + newFileName + extension);
    } else {
      await fsp.copyFile(tempPath, destPath + newFileName + ".mp3");
    }

    const metadata = await mediaHandler.getMediaInfo(newAudioDestPath);
    fileData.fileType = Const.fileTypeAudio;
    fileData.file.mimeType = "audio/mpeg";
    fileData.file.duration = Utils.roundNumber(metadata.duration, 6);
    fileData.file.size = metadata.size;

    let segmentTimesList = "2,6,10";
    const repeatFactor =
      fileData.file.duration > 10 ? Math.ceil((fileData.file.duration - 10) / 10) : 0;
    for (let i = 1; i <= repeatFactor; i++) {
      segmentTimesList += `,${i * 10 + 10}`;
    }

    let convertToHslSuccess = false;
    try {
      await Utils.convertToHSL(
        destPath + newFileName + ".mp3",
        destPath + hslName,
        segmentTimesList,
      );
      convertToHslSuccess = true;
    } catch (error) {
      convertToHslSuccess = false;
    }

    fileData.file.hslName = convertToHslSuccess ? hslName : "";

    return fileData;
  } catch (error) {
    console.error(error);
    throw new Error("Error in handleAudioFile");
  }
}

async function deleteFile(productFile) {
  try {
    const { file, thumb, fileType } = productFile;

    //NOTE remove .mp4 when nameOnServer is fixed for new Flom
    let filePath = Config.uploadPath + "/" + file.nameOnServer;
    if (fileType === Const.fileTypeVideo) {
      filePath += ".mp4";
    }
    await fs.remove(filePath);

    if (fileType === Const.fileTypeVideo || fileType === Const.fileTypeAudio) {
      let hslFilePath = Config.uploadPath + "/" + file.hslName + ".m3u8";
      let i = 0;
      while (fs.existsSync(hslFilePath)) {
        await fs.remove(hslFilePath);
        hslFilePath = Config.uploadPath + "/" + file.hslName + i++ + ".ts";
      }
    }

    if (fileType !== Const.fileTypeAudio) {
      await fs.remove(Config.uploadPath + "/" + thumb.nameOnServer);
    }
  } catch (error) {
    console.error(error);
    throw new Error("Error in deleteFile");
  }
}

module.exports = {
  handleVideoFile,
  handleImageFile,
  handleAudioFile,
  deleteFile,
};
