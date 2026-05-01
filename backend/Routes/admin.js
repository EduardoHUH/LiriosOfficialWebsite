const express = require('express');
const router = express.Router();

const controller = require('../Controller/adminController');

router.post('/login', controller.login);

module.exports = router;
