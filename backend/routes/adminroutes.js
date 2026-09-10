const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const ctrl = require('../controllers/adminController');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/users', ctrl.listUsers);
router.patch('/users/:id/status', ctrl.setUserStatus);

router.get('/verification-queue', ctrl.getVerificationQueue);
router.post('/verification/:sellerId/decision', ctrl.decideVerification);

router.get('/listings', ctrl.listListingsForModeration);
router.patch('/listings/:id/status', ctrl.setListingStatus);

router.get('/requirements', ctrl.listRequirementsForModeration);

router.get('/ledger', ctrl.getLedger);

module.exports = router;