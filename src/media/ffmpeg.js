const { spawn } = require("child_process");

function ffmpeg(args = [], inputStream = null, outputStream = null) {
  if (args.length === 0) {
    throw new Error("ffmpeg, no args");
  }
  if (!inputStream) {
    throw new Error("ffmpeg, no inputStream");
  }
  if (!outputStream) {
    throw new Error("ffmpeg, no outputStream");
  }

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"] });

    let stderr = "";

    ffmpeg.stderr.on("data", (chunk) => {
      const str = chunk.toString();
      stderr += str;
    });

    ffmpeg.on("error", (err) => reject(err));

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
    });

    if (inputStream) inputStream.pipe(ffmpeg.stdin);
    if (outputStream) ffmpeg.stdout.pipe(outputStream);
  });
}

module.exports = ffmpeg;
