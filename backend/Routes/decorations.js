const express = require('express');
const router = express.Router();

const controller = require('../Controller/decorationsController');

router.get('/', controller.list);

module.exports = router;
