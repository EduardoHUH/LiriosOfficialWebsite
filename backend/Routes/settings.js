const express = require("express");
const router = express.Router();

const controller = require("../Controller/settingsController");
const verifyToken = require("../middleware/auth");

router.get("/announcement", controller.getAnnouncement);
router.put("/announcement", verifyToken, controller.updateAnnouncement);

module.exports = router;