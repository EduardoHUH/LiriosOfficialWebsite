const express = require("express");
const router = express.Router();

const quotesController = require("../Controller/quotesController");
const verifyToken = require("../middleware/auth");
const upload = require("../middleware/upload");


// CRUD COTIZACIONES

router.post("/", quotesController.createQuote);
router.post("/reference-image", upload.single("referenceImage"), quotesController.uploadReferenceImage);
router.get("/", verifyToken, quotesController.getAllQuotes);
router.get("/pdf/:id", verifyToken, quotesController.generatePDF);
router.get("/:id", verifyToken, quotesController.getQuoteById);
router.delete("/:id", verifyToken, quotesController.deleteQuote);
router.patch("/:id/status", verifyToken, quotesController.updateQuoteStatus);

module.exports = router;
