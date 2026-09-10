const express = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

const router = express.Router();

router.get('/', requireAuth, ctrl.listNotifications);
router.post('/:id/read', requireAuth, ctrl.markRead);
router.post('/read-all', requireAuth, ctrl.markAllRead);

module.exports = router;