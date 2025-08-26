// ClubOps - VIP Room Management Routes
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.json({ 
      message: 'VIP Rooms endpoint - coming soon',
      clubId: req.clubId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;