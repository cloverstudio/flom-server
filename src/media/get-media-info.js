const path = require("path");
const fsp = require("fs/promises");
const sharp = require("sharp");
const WebP = require("node-webpmux");
const ffprobe = require("./ffprobe");

async function getMediaInfo(filePath) {
  const info = {};

  const ffprobeInfo = await ffprobe(filePath);
  info.duration = +ffprobeInfo.format.duration;
  info.size = +ffprobeInfo.format.size;

  for (const stream of ffprobeInfo.streams) {
    if (stream.width) info.width = +stream.width;
    if (stream.height) info.height = +stream.height;
    if (stream.tags?.rotate ?? stream.rotation) {
      info.rotation = stream.tags?.rotate ?? stream.rotation;
    }
    if (stream.codec_type === "audio") info.audioBitRate = Math.round(+stream.bit_rate / 1024);
    if (stream.codec_type === "video") {
      info.videoBitRate = Math.round(+stream.bit_rate / 1024);
      const avg_fps = stream.avg_frame_rate;
      const temp = avg_fps.split("/");
      info.fps = +temp[0] / +temp[1];
    }
  }

  return info;
}

async function getImageInfo(filePath) {
  const ext = path.extname(filePath);

  const metaData = { width: null, height: null, size: null };

  if (ext !== ".webp") {
    const isAnimated = ext === ".gif";
    const sharpImage = sharp(filePath, !isAnimated ? {} : { animated: true, pages: -1 });
    const meta = await sharpImage.metadata();

    metaData.height = meta.height;
    metaData.width = meta.width;
    metaData.size = meta.size;
  } else {
    const image = new WebP.Image();
    await image.load(filePath);
    const stats = await fsp.stat(filePath);

    metaData.height = +image.height;
    metaData.width = +image.width;
    metaData.size = stats.size;
  }

  return metaData;
}

module.exports = {
  getVideoInfo: getMediaInfo,
  getAudioInfo: getMediaInfo,
  getMediaInfo,
  getImageInfo,
};
