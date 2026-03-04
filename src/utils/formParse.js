const formidable = require("formidable");

async function formParse(request, options = {}) {
  const form = new formidable.IncomingForm();
  form.maxFileSize = 500 * 1024 * 1024;
  if (options?.keepExtensions !== undefined) form.keepExtensions = options.keepExtensions;
  if (options?.type !== undefined) form.type = options.type;
  if (options?.multiples !== undefined) form.multiples = options.multiples;
  if (options?.uploadDir !== undefined) form.uploadDir = options.uploadDir;

  return new Promise((resolve, reject) => {
    form.parse(request, (err, fields, files) => {
      if (err) return reject(err);
      resolve({
        fields,
        files,
      });
    });
  });
}

module.exports = formParse;
