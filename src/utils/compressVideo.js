const executeCommand = require("./executeCommand");
const mediaHandler = require("#media");

async function compressVideo({
  originalFilePath: inputPath,
  destinationPath,
  newFileName,
  compressToWebm = true,
  keyFramesList,
}) {
  if (!keyFramesList) {
    throw new Error("keyFramesList missing!");
  }

  const outputPath = destinationPath + newFileName + "_compressed.mp4";
  const webmSdOutputPath = destinationPath + newFileName + "_av1_sd.webm";

  const videoMetaData = await mediaHandler.getMediaInfo(inputPath);
  let rotation = videoMetaData.rotation;
  console.log("rotation tag: " + rotation);
  let width = videoMetaData.width,
    height = videoMetaData.height,
    fps = videoMetaData.fps,
    videoBitRate = videoMetaData.videoBitRate,
    audioBitRate = videoMetaData.audioBitRate;

  let aspectRatioArg = "";
  const smallerDimension = width > height ? height : width;
  if (smallerDimension >= 560) {
    let newWidth, newHeight;
    const aspectRatio = width / height;

    if (width > height) {
      newHeight = 540;
      newWidth = Math.round(newHeight * aspectRatio);
      newWidth = newWidth % 2 === 1 ? newWidth + 1 : newWidth;
    } else {
      newWidth = 540;
      newHeight = Math.round(newWidth / aspectRatio);
      newHeight = newHeight % 2 === 1 ? newHeight + 1 : newHeight;
    }

    aspectRatioArg = `scale=${newWidth}:${newHeight}`;
  } else {
    width = width % 2 === 1 ? width + 1 : width;
    height = height % 2 === 1 ? height + 1 : height;
    aspectRatioArg = `scale=${width}:${height}`;
  }

  let frameRate = "";
  if (fps > 40) {
    fps = 30;
    frameRate = "-r 30 ";
  }

  const keyint = Math.ceil(fps * 1);

  let videoBitRateArg = "1200",
    audioBitRateArg = "64",
    webmSdBitRateArg = "500";
  if (videoBitRate < 1200) {
    videoBitRateArg = `${videoBitRate}`;
  }
  if (videoBitRate <= 500) {
    webmSdBitRateArg = `${videoBitRate}`;
  }
  if (videoBitRate > 500 && videoBitRate <= 800) {
    webmSdBitRateArg = `${Math.round(videoBitRate / 2)}`;
  }
  if (audioBitRate < 64) {
    audioBitRateArg = `${audioBitRate}`;
  }

  let transposeArg = null;
  if (rotation !== 0) {
    switch (rotation) {
      case "90":
      case "-90":
        transposeArg = "transpose=1";
        break;
      case "180":
        transposeArg = "transpose=2,transpose=2";
        break;
      case "270":
        transposeArg = "transpose=2";
        break;
      default:
        transposeArg = null;
        break;
    }
  }
  console.log("transposeArg: " + transposeArg);

  let videoFilterArg = "";
  if (transposeArg) {
    videoFilterArg = `"` + aspectRatioArg + "," + transposeArg + `" `;
  } else {
    videoFilterArg = aspectRatioArg + " ";
  }

  console.log("videoFilterArg: " + videoFilterArg);

  const conversionCommand = `ffmpeg -display_rotation 0 -i ${inputPath} -max_muxing_queue_size 9999 -force_key_frames ${keyFramesList} -c:v libx264 ${frameRate}-vf ${videoFilterArg}-b:v ${videoBitRateArg}k -minrate ${
    +videoBitRateArg - 200
  }k -maxrate ${
    +videoBitRateArg + 200
  }k -bufsize 4M -c:a aac -b:a ${audioBitRateArg}k ${outputPath}`;

  const webmConversionCommand = `ffmpeg -display_rotation 0 -i ${inputPath} -max_muxing_queue_size 9999 -c:v libsvtav1 ${frameRate}-vf ${videoFilterArg}-svtav1-params "rc=1:tbr=${webmSdBitRateArg}k:g=${keyint}:keyint_min=${keyint}:preset=8" -c:a libopus -b:a ${audioBitRateArg}k ${webmSdOutputPath}`;

  console.log("compressVideo command: " + conversionCommand);
  const res = await executeCommand({ command: conversionCommand });
  if (!res) {
    console.log("Error while compressing video file");
    console.error("Error while compressing video file");
    throw new Error("Error while compressing video file");
  }

  if (compressToWebm) {
    console.log("compressVideo sd webm command: " + webmConversionCommand);
    const res2 = await executeCommand({ command: webmConversionCommand });
    if (!res2) {
      console.log("Error while compressing video file to sd webm");
      console.error("Error while compressing video file to sd webm");
      throw new Error("Error while compressing video file to sd webm");
    }
  }
}

module.exports = compressVideo;
