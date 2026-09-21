const express = require('express');
const router = express.Router();
const { authenticate, requireActiveAccount, authorize } = require('../middleware/auth');
const { DonationCampaign, Donation } = require('../models/Donation');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const { AppError } = require('../middleware/errorHandler');
const { uploadFile, upload } = require('../services/storageService');
const { v4: uuidv4 } = require('uuid');
const authService = require('../services/authService');

// ===== Campaigns =====

// GET /donations/campaigns
router.get('/campaigns', authenticate, async (req, res, next) => {
  try {
    const { status = 'active', category, page = 1, limit = 12 } = req.query;
    const filter = {};
    if (status !== 'all') filter.status = status;
    if (category) filter.category = category;

    const [campaigns, total] = await Promise.all([
      DonationCampaign.find(filter)
        .populate('createdBy', 'firstName lastName profilePhoto')
        .sort({ featuredOrder: 1, publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      DonationCampaign.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { campaigns, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// GET /donations/campaigns/:id
router.get('/campaigns/:id', authenticate, async (req, res, next) => {
  try {
    const campaign = await DonationCampaign.findById(req.params.id)
      .populate('createdBy', 'firstName lastName profilePhoto')
      .populate('approvedBy', 'firstName lastName');
    if (!campaign) throw new AppError('Campaign not found.', 404);

    // Recent non-anonymous contributors (for campaign page display)
    const recentDonors = await Donation.find({ campaign: campaign._id, status: 'success', isAnonymous: false })
      .populate('donor', 'firstName profilePhoto')
      .sort({ completedAt: -1 })
      .limit(10);

    return res.json({ success: true, data: { campaign, recentDonors } });
  } catch (err) { next(err); }
});

// POST /donations/campaigns — admin creates campaign
router.post('/campaigns', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), upload.single('coverImage'), async (req, res, next) => {
  try {
    let coverImage;
    if (req.file) {
      const uploaded = await uploadFile(req.file, { folder: 'campaigns' });
      coverImage = uploaded.url;
    }

    const slug = req.body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    const campaign = await DonationCampaign.create({
      ...req.body,
      createdBy: req.user._id,
      coverImage,
      slug,
      status: 'pending_approval',
    });

    return res.status(201).json({ success: true, message: 'Campaign submitted for approval.', data: campaign });
  } catch (err) { next(err); }
});

// PATCH /donations/campaigns/:id/approve
router.patch('/campaigns/:id/approve', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const campaign = await DonationCampaign.findByIdAndUpdate(
      req.params.id,
      {
        status: 'active',
        approvedBy: req.user._id,
        approvedAt: new Date(),
        publishedAt: new Date(),
      },
      { new: true }
    );
    if (!campaign) throw new AppError('Campaign not found.', 404);

    await authService.createAuditLog({
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'campaign_approved',
      targetType: 'DonationCampaign',
      targetId: campaign._id,
      targetDisplay: campaign.title,
      severity: 'high',
    });

    return res.json({ success: true, message: 'Campaign approved and published.', data: campaign });
  } catch (err) { next(err); }
});

// PATCH /donations/campaigns/:id/status — pause/close/archive
router.patch('/campaigns/:id/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['paused', 'closed', 'archived'];
    if (!allowed.includes(status)) throw new AppError(`Status must be one of: ${allowed.join(', ')}`, 400);

    const campaign = await DonationCampaign.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!campaign) throw new AppError('Campaign not found.', 404);

    return res.json({ success: true, message: `Campaign ${status}.`, data: campaign });
  } catch (err) { next(err); }
});

// POST /donations/campaigns/:id/update — add transparency update
router.post('/campaigns/:id/update', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const campaign = await DonationCampaign.findByIdAndUpdate(
      req.params.id,
      { $push: { updates: { title, content, publishedBy: req.user._id, publishedAt: new Date() } } },
      { new: true }
    );
    if (!campaign) throw new AppError('Campaign not found.', 404);
    return res.json({ success: true, message: 'Update published.', data: campaign });
  } catch (err) { next(err); }
});

// ===== Contributions =====

// POST /donations/campaigns/:id/contribute — initiate contribution
router.post('/campaigns/:id/contribute', authenticate, requireActiveAccount, async (req, res, next) => {
  try {
    const campaign = await DonationCampaign.findById(req.params.id);
    if (!campaign || campaign.status !== 'active') throw new AppError('Campaign is not available for contributions.', 400);
    if (campaign.endDate && new Date() > campaign.endDate) throw new AppError('Campaign has ended.', 400, 'CAMPAIGN_ENDED');

    const { amount, isAnonymous = false, notes } = req.body;
    if (!amount || amount < 1) throw new AppError('Minimum contribution amount is ₹1.', 400);

    // Generate unique donation ID
    const donationId = `ALM-DON-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;
    const receiptNumber = `ALM-RCP-${Date.now().toString(36).toUpperCase()}`;

    // Create payment order
    const order = await paymentService.createOrder({
      amount,
      currency: 'INR',
      receipt: donationId,
      notes: { campaignId: campaign._id.toString(), donorId: req.user._id.toString() },
    });

    // Create donation record (status: initiated)
    const donation = await Donation.create({
      campaign: campaign._id,
      donor: req.user._id,
      isAnonymous,
      amount,
      donationId,
      receiptNumber,
      status: 'initiated',
      paymentProvider: process.env.PAYMENT_PROVIDER || 'mock',
      paymentOrderId: order.orderId,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: 'Contribution initiated. Complete payment to confirm.',
      data: {
        donation: { _id: donation._id, donationId, amount, status: donation.status },
        payment: order,
      },
    });
  } catch (err) { next(err); }
});

// POST /donations/:donationId/verify — verify payment and finalize
router.post('/:donationId/verify', authenticate, async (req, res, next) => {
  try {
    const donation = await Donation.findOne({ donationId: req.params.donationId, donor: req.user._id });
    if (!donation) throw new AppError('Donation not found.', 404);
    if (donation.status === 'success') throw new AppError('Already verified.', 400);

    const { paymentId, signature } = req.body;

    // Verify payment
    const result = await paymentService.verifyPayment({
      orderId: donation.paymentOrderId,
      paymentId,
      signature,
    });

    if (result.verified) {
      donation.status = 'success';
      donation.paymentReference = result.paymentReference;
      donation.paymentSignature = signature;
      donation.completedAt = new Date();
      donation.receiptGenerated = true;
      await donation.save();

      // Update campaign totals
      await DonationCampaign.findByIdAndUpdate(donation.campaign, {
        $inc: { raisedAmount: donation.amount, contributorCount: 1 },
      });

      // Send receipt email
      const campaign = await DonationCampaign.findById(donation.campaign);
      if (!donation.isAnonymous) {
        await emailService.sendDonationReceiptEmail({
          to: req.user.email,
          name: req.user.firstName,
          donationId: donation.donationId,
          campaignTitle: campaign?.title || 'Campaign',
          amount: donation.amount,
        });
      }

      // Send in-app notification
      await notificationService.notifyDonationSuccess(req.user._id, donation, campaign);

      // Update alumni impact score
      await updateAlumniImpact(req.user._id, 'donations', 5);

      return res.json({
        success: true,
        message: 'Contribution successful! Thank you for your generosity.',
        data: {
          donationId: donation.donationId,
          amount: donation.amount,
          receiptNumber: donation.receiptNumber,
          status: donation.status,
        },
      });
    } else {
      donation.status = 'failed';
      donation.failureReason = result.error || 'Payment verification failed';
      await donation.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Please try again.',
        code: 'PAYMENT_FAILED',
        data: { donationId: donation.donationId, status: donation.status },
      });
    }
  } catch (err) { next(err); }
});

// GET /donations/mine — my contributions
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { donor: req.user._id };
    if (status) filter.status = status;

    const [donations, total] = await Promise.all([
      Donation.find(filter)
        .populate('campaign', 'title coverImage category status')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Donation.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { donations, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// GET /donations/receipt/:donationId
router.get('/receipt/:donationId', authenticate, async (req, res, next) => {
  try {
    const donation = await Donation.findOne({
      donationId: req.params.donationId,
      $or: [{ donor: req.user._id }, ...(req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN' ? [{}] : [])],
    }).populate('campaign', 'title category beneficiary').populate('donor', 'firstName lastName email panNumber');

    if (!donation) throw new AppError('Receipt not found.', 404);

    if (donation.status !== 'success') {
      throw new AppError('Receipt cannot be generated. Official 80G tax exemption certificates are only issued for successfully settled donations.', 400);
    }

    return res.json({ success: true, data: donation });
  } catch (err) { next(err); }
});

// GET /donations/receipt/:donationId/pdf (Direct PDF Download)
router.get('/receipt/:donationId/pdf', authenticate, async (req, res, next) => {
  try {
    const donation = await Donation.findOne({
      donationId: req.params.donationId,
      $or: [{ donor: req.user._id }, ...(req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN' ? [{}] : [])],
    }).populate('campaign', 'title category beneficiary').populate('donor', 'firstName lastName email panNumber');

    if (!donation) throw new AppError('Receipt not found.', 404);

    if (donation.status !== 'success') {
      throw new AppError('Official 80G tax exemption certificates can only be downloaded for completed donations.', 400);
    }

    const { generateDonationReceiptPDF } = require('../services/receiptPdfService');
    const filename = `TCET_80G_Donation_Certificate_${(donation.receiptNumber || donation.donationId).replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await generateDonationReceiptPDF(donation, res);
  } catch (err) { next(err); }
});

// GET /donations/admin/analytics (Admin)
router.get('/admin/analytics', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const [
      totalSuccess,
      totalPending,
      totalFailed,
      activeCampaigns,
      completedCampaigns,
      topCampaigns,
      monthlyTrend,
    ] = await Promise.all([
      Donation.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Donation.countDocuments({ status: 'pending' }),
      Donation.countDocuments({ status: 'failed' }),
      DonationCampaign.countDocuments({ status: 'active' }),
      DonationCampaign.countDocuments({ status: 'completed' }),
      DonationCampaign.find({}).select('title raisedAmount goalAmount contributorCount status category').sort({ raisedAmount: -1 }).limit(5),
      Donation.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
    ]);

    const successData = totalSuccess[0] || { total: 0, count: 0 };

    return res.json({
      success: true,
      data: {
        totalRaised: successData.total,
        successfulContributions: successData.count,
        pendingTransactions: totalPending,
        failedTransactions: totalFailed,
        activeCampaigns,
        completedCampaigns,
        averageContribution: successData.count > 0 ? Math.round(successData.total / successData.count) : 0,
        topCampaigns,
        monthlyTrend: monthlyTrend.reverse(),
      },
    });
  } catch (err) { next(err); }
});

async function updateAlumniImpact(userId, category, points) {
  const Profile = require('../models/Profile');
  try {
    await Profile.findOneAndUpdate(
      { user: userId },
      {
        $inc: {
          impactScore: points,
          [`impactBreakdown.${category}`]: points,
        },
      }
    );
  } catch {
    // Non-critical — don't fail contribution
  }
}

module.exports = router;
