const router = require("express").Router();

router.use("/files", require("./Controllers/UploadFilesController"));
router.use("/file/upload/multiple", require("./Controllers/MultipleFileUploadController"));
router.use("/file/upload", require("./Controllers/FileUploadController"));
router.use("/file/stream", require("./Controllers/FileStreamController"));
router.use("/file", require("./Controllers/FileDownloadController"));

module.exports = router;
