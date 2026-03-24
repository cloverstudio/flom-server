const { spawn } = require("child_process");

function ffprobe(filePath) {
  return new Promise((resolve, reject) => {
    const args = [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      filePath,
    ];

    const ffprobe = spawn("ffprobe", args);

    let stdout = "";
    let stderr = "";

    ffprobe.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    ffprobe.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    ffprobe.on("error", reject);

    ffprobe.on("close", (code) => {
      if (code === 0) {
        try {
          const json = JSON.parse(stdout);
          resolve(json);
        } catch (err) {
          reject(new Error(`Failed to parse FFprobe JSON: ${err.message}`));
        }
      } else {
        reject(new Error(`FFprobe exited with code ${code}: ${stderr}`));
      }
    });
  });
}

module.exports = ffprobe;
