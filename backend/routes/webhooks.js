// ClubOps - Webhook Routes (Stripe, etc.)
const express = require('express');
const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('Stripe webhook received');
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;