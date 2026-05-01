const express = require('express');
const router = express.Router();

const controller = require('../Controller/appointmentsController');

router.get('/', controller.list);
router.post('/', controller.save);

module.exports = router;
