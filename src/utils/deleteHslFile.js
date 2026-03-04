const fs = require("fs-extra");

function deleteHslFile(path, cb) {
  if (fs.existsSync(path)) {
    const pathArr = path.split("/");
    const fileName = pathArr[pathArr.length - 1];
    const baseName = fileName.split(".")[0];
    const root = pathArr.filter((e) => e !== fileName).join("/") + "/";
    fs.unlink(path, () => cb(fileName));
    let file = baseName + "0.ts";
    let fileExt = fs.existsSync(root + file);
    let i = 1;
    while (fileExt) {
      fs.unlink(root + file, () => {});
      file = baseName + i + ".ts";
      fileExt = fs.existsSync(root + file);
      i++;
    }
    cb("ts files");
  }
}

module.exports = deleteHslFile;
