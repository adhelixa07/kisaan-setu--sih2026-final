const express = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/messageController');

const router = express.Router();

router.get('/:resourceType/:resourceId', requireAuth, ctrl.getThread);
router.post('/:resourceType/:resourceId', requireAuth, ctrl.sendMessage);

module.exports = router;