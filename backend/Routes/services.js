const express = require('express');
const router = express.Router();

const controller = require('../Controller/servicesController');

router.get('/techniques', controller.list);
router.get('/lengths', controller.listLengths);

module.exports = router;
