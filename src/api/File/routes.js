const router = require("express").Router();

router.use("/file", require("./Controllers/FileDownloadController"));
router.use("/file/upload", require("./Controllers/FileUploadController"));
router.use("/file/upload/multiple", require("./Controllers/MultipleFileUploadController"));
router.use("/file/stream", require("./Controllers/FileStreamController"));
router.use("/files", require("./Controllers/UploadFilesController"));

module.exports = router;
