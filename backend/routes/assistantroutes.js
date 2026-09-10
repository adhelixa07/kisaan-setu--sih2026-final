const express = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/assistantController');

const router = express.Router();

router.post('/query', requireAuth, ctrl.query);

module.exports = router;