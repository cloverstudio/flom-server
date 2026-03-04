const router = require("express").Router();

router.use("/note/save", require("./Controllers/SaveNotesController"));
router.use("/note/list", require("./Controllers/LoadNotesController"));
router.use("/note/list", require("./Controllers/NoteListController"));

module.exports = router;
