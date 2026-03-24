const { logger } = require("#infra");
const { Const, Config } = require("#config");
const mediaHandler = require("#media");
const uuid = require("uuid");
const path = require("path");
const fsp = require("fs/promises");
const sharp = require("sharp");
const Tesseract = require("tesseract.js");
const executeCommand = require("./executeCommand");

let tesseractWorker = null;

async function getTesseractWorker() {
  if (!tesseractWorker) {
    tesseractWorker = await Tesseract.createWorker("eng");
  }

  return tesseractWorker;
}

async function checkVideoForWatermarks({ filePath, duration, productId }) {
  try {
    if (!duration) {
      const inputMetadata = await mediaHandler.getMediaInfo(filePath);
      duration = inputMetadata.duration;
    }

    const dirname = uuid.v4();
    const tempDir = path.resolve(Config.uploadPath, "watermark_detection", dirname);

    logger.info(`Checking video of product ${productId} for watermarks, temp dir: ${dirname}`);

    await fsp.mkdir(tempDir, { recursive: true });

    const frames = [
      { t: 2, f: path.resolve(tempDir, "frame1.png") },
      { t: Math.floor(duration / 2), f: path.resolve(tempDir, "frame2.png") },
      { t: Math.floor(duration - 2), f: path.resolve(tempDir, "frame3.png") },
    ];

    for (const frame of frames) {
      await executeCommand({
        command: `ffmpeg -ss ${frame.t} -i ${filePath} -frames:v 1 ${frame.f}`,
      });

      const buffer = await prepareFrameForOCR(frame.f);
      frame.b = buffer;
    }

    const { text = "", found = [] } = await runOCR(frames.map((f) => f.b));
    logger.info(`OCR Result for file ${dirname} of product ${productId}:`, { text, found });

    if (Config.environment === "production") {
      // Clean up temp frames
      for (const frame of frames) {
        await fsp.unlink(frame.f).catch(() => {});
      }
      await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }

    return found.length > 0;
  } catch (error) {
    logger.error(`Error checking video for watermarks of product ${productId}:`, error);
    return true; // Assume watermarks if there's an error to be safe
  }
}

async function prepareFrameForOCR(inputPath) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  const cropWidth = Math.floor(metadata.width * 0.3);
  const cropHeight = Math.floor(metadata.height * 0.25);

  // Extract 4 corners
  const corners = await Promise.all([
    image
      .clone()
      .extract({ left: 0, top: 0, width: cropWidth, height: cropHeight })
      .toColorspace("b-w")
      .linear(1, 0)
      .normalize()
      .threshold(150)
      .sharpen()
      .toBuffer(), // TL
    image
      .clone()
      .extract({
        left: metadata.width - cropWidth - 1,
        top: 0,
        width: cropWidth,
        height: cropHeight,
      })
      .toColorspace("b-w")
      .linear(1, 0)
      .normalize()
      .threshold(150)
      .sharpen()
      .toBuffer(), // TR
    image
      .clone()
      .extract({
        left: 0,
        top: metadata.height - cropHeight - 1,
        width: cropWidth,
        height: cropHeight,
      })
      .toColorspace("b-w")
      .linear(1, 0)
      .normalize()
      .threshold(150)
      .sharpen()
      .toBuffer(), // BL
    image
      .clone()
      .extract({
        left: metadata.width - cropWidth - 1,
        top: metadata.height - cropHeight - 1,
        width: cropWidth,
        height: cropHeight,
      })
      .toColorspace("b-w")
      .linear(1, 0)
      .normalize()
      .threshold(150)
      .sharpen()
      .toBuffer(), // BR
  ]);

  // Create a blank canvas (2x2 grid)
  const stitched = sharp({
    create: {
      width: cropWidth * 2,
      height: cropHeight * 2,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  });

  // Composite images into grid
  const composed = await stitched
    .composite([
      { input: corners[0], top: 0, left: 0 }, // TL
      { input: corners[1], top: 0, left: cropWidth }, // TR
      { input: corners[2], top: cropHeight, left: 0 }, // BL
      { input: corners[3], top: cropHeight, left: cropWidth }, // BR
    ])
    .png()
    .toBuffer();

  return composed;
}

const platforms = [
  "@",
  "insta",
  "youtube",
  "yt.",
  "tiktok",
  "twitter",
  "x.com",
  "snapchat",
  "facebook",
  "@fb",
  "linkedin",
  "pinterest",
  "reddit",
  "tumblr",
  "twitch",
  "discord",
  "onlyfans",
  "@onlyfans",
  "@of",
  "patreon",
  "vimeo",
  "dailymotion",
];

async function runOCR(imageBufferArray) {
  const worker = await getTesseractWorker();

  let combinedText = [];
  for (const buffer of imageBufferArray) {
    const {
      data: { text },
    } = await worker.recognize(buffer);

    combinedText.push(text);
  }

  const cleaned = combinedText
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9.@]/g, "") // keep useful chars
    .trim();

  const found = platforms.filter((platform) => cleaned.includes(platform));

  return { text: cleaned, found };
}

module.exports = checkVideoForWatermarks;
