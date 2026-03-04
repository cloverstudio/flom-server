"use strict";

const { Config } = require("#config");

module.exports = {
  formatImageData: (file) => ({
    originalName: file.name,
    size: file.size,
    mimeType: file.type,
    nameOnServer: `upload_${file.path.split("upload_")[1]}`,
    link: `${Config.uploadPath}/upload_${file.path.split("upload_")[1]}`,
  }),
};
