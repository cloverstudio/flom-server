const util = require("util");
const fs = require("fs-extra");
const copy = util.promisify(fs.copy);

const { Config } = require("#config");
const getRandomString = require("./getRandomString");
const convertToMP3 = require("./convertToMP3");
const convertToHSL = require("./convertToHSL");
const roundNumber = require("./roundNumber");
const mediaHandler = require("#media");

async function handleAudioFile({ file, dir = null, allowedExtensions = null }) {
  const originalFilePath = file.path;
  const originalFileName = file.name;

  const tmp = originalFileName.split(".");
  const extension = tmp[tmp.length - 1];
  if (allowedExtensions && !allowedExtensions.includes(extension)) {
    return { code: 123 };
  }

  const fileMimeType = file.type;
  const destPath = Config.uploadPath + "/";
  const newFileName = getRandomString(32);
  const hslName = getRandomString(32);
  const fileData = {
    originalFileName,
    nameOnServer: newFileName + ".mp3",
  };

  dir = !dir ? "" : `${dir}/`;
  let newAudioDestPath = "";

  if (fileMimeType !== "audio/mpeg") {
    let extension = ".mp3";

    switch (fileMimeType) {
      case "audio/aac":
        extension = ".aac";
        break;
      case "audio/x-aac":
        extension = ".aac";
        break;
      case "audio/wav":
        extension = ".wav";
      case "audio/x-wav":
        extension = ".wav";
    }

    newAudioDestPath = destPath + dir + newFileName + extension;
    await convertToMP3(originalFilePath, newAudioDestPath);
  } else {
    newAudioDestPath = destPath + dir + newFileName + ".mp3";
    await copy(originalFilePath, newAudioDestPath);
  }
  await fs.remove(originalFilePath);

  const metadata = await mediaHandler.getMediaInfo(newAudioDestPath);
  fileData.mimeType = "audio/mpeg";
  fileData.duration = roundNumber(metadata.duration, 0);
  fileData.size = metadata.size;

  let segmentTimesList = "2,6,10";
  const repeatFactor = fileData.duration > 10 ? Math.ceil((fileData.duration - 10) / 10) : 0;
  for (let i = 1; i <= repeatFactor; i++) {
    segmentTimesList += `,${i * 10 + 10}`;
  }

  let convertToHslSuccess = false;
  try {
    await convertToHSL(
      destPath + dir + newFileName + ".mp3",
      destPath + dir + hslName,
      segmentTimesList,
    );
    convertToHslSuccess = true;
  } catch (error) {
    convertToHslSuccess = false;
  }

  fileData.hslName = convertToHslSuccess ? hslName : "";

  return { code: null, fileData };
}

module.exports = handleAudioFile;
