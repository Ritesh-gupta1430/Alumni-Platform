const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authenticate, requireEmailVerified, authorize } = require('../middleware/auth');
const { upload } = require('../services/storageService');

// Student routes
router.post(
  '/submit',
  authenticate,
  requireEmailVerified,
  upload.array('documents', 10),
  verificationController.submitVerification
);
router.get('/status', authenticate, verificationController.getVerificationStatus);

// Admin routes
router.get('/admin/list', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), verificationController.listVerifications);
router.get('/admin/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), verificationController.getVerificationDetail);
router.patch('/admin/:id/approve', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), verificationController.approveVerification);
router.patch('/admin/:id/reject', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), verificationController.rejectVerification);
router.patch('/admin/:id/request-correction', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), verificationController.requestCorrection);

module.exports = router;
