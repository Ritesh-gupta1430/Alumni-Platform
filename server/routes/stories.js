const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Alumni stories placeholder (will be expanded with Post model)
router.get('/', authenticate, async (req, res) => {
  return res.json({ success: true, data: { stories: [], total: 0, note: 'Stories module — coming in Phase 4' } });
});

module.exports = router;
