const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Subscription tiers configuration
const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    maxDancers: 10,
    maxManagers: 2,
    maxVipRooms: 3,
    storageGB: 1,
    features: ['Basic dancer management', 'License tracking', 'Simple reports']
  },
  basic: {
    name: 'Basic',
    price: 49,
    priceId: 'price_basic_monthly', // Stripe price ID
    maxDancers: 50,
    maxManagers: 5,
    maxVipRooms: 10,
    storageGB: 10,
    features: ['All Free features', 'DJ Queue Management', 'VIP Room tracking', 'Monthly reports']
  },
  pro: {
    name: 'Pro',
    price: 99,
    priceId: 'price_pro_monthly',
    maxDancers: 200,
    maxManagers: 15,
    maxVipRooms: 25,
    storageGB: 50,
    features: ['All Basic features', 'Advanced analytics', 'Custom reporting', 'API access']
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    priceId: 'price_enterprise_monthly',
    maxDancers: 999,
    maxManagers: 50,
    maxVipRooms: 100,
    storageGB: 200,
    features: ['All Pro features', 'White-label options', 'Priority support', 'Custom integrations']
  }
};

// @route   GET /api/subscriptions/tiers
// @desc    Get available subscription tiers
// @access  Public
router.get('/tiers', (req, res) => {
  res.json(SUBSCRIPTION_TIERS);
});

// @route   GET /api/subscriptions/current
// @desc    Get current club subscription info
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const club = await prisma.club.findUnique({
      where: { id: req.user.clubId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const currentTier = SUBSCRIPTION_TIERS[club.subscriptionTier] || SUBSCRIPTION_TIERS.free;
    
    res.json({
      subscription: {
        tier: club.subscriptionTier,
        status: club.subscriptionStatus,
        stripeSubscriptionId: club.subscriptions[0]?.stripeSubscriptionId || null
      },
      tierInfo: currentTier,
      limits: {
        maxDancers: currentTier.maxDancers,
        maxManagers: currentTier.maxManagers,
        maxVipRooms: currentTier.maxVipRooms,
        storageGB: currentTier.storageGB
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/subscriptions/create-checkout
// @desc    Create Stripe checkout session for subscription upgrade
// @access  Private
router.post('/create-checkout', auth, authorize('owner'), async (req, res) => {
  try {
    const { tier } = req.body;
    
    if (!SUBSCRIPTION_TIERS[tier] || tier === 'free') {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const club = await prisma.club.findUnique({
      where: { id: req.user.clubId }
    });
    
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const tierInfo = SUBSCRIPTION_TIERS[tier];
    
    // Create or retrieve Stripe customer
    let customerId = null;
    
    // Look for existing payment method
    const existingPayment = await prisma.paymentMethod.findFirst({
      where: { clubId: club.id }
    });
    
    if (!existingPayment) {
      const customer = await stripe.customers.create({
        email: req.fullUser.email,
        name: `${req.fullUser.firstName} ${req.fullUser.lastName}`,
        metadata: {
          clubId: club.id,
          clubName: club.name
        }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: tierInfo.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/subscription/pricing`,
      metadata: {
        clubId: club.id,
        tier: tier
      }
    });

    res.json({ 
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ error: 'Server error creating checkout session' });
  }
});

// @route   POST /api/subscriptions/cancel
// @desc    Cancel subscription
// @access  Private (Owner only)
router.post('/cancel', auth, authorize('owner'), async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { clubId: req.user.clubId },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel the subscription at period end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Update subscription record
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true }
    });

    res.json({ 
      message: 'Subscription will be cancelled at the end of the current billing period'
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Server error canceling subscription' });
  }
});

// @route   GET /api/subscriptions/usage
// @desc    Get current usage statistics
// @access  Private
router.get('/usage', auth, async (req, res) => {
  try {
    const [dancerCount, managerCount, vipRoomCount] = await Promise.all([
      prisma.dancer.count({
        where: { clubId: req.user.clubId, isActive: true }
      }),
      prisma.clubUser.count({
        where: { clubId: req.user.clubId, isActive: true }
      }),
      prisma.vipRoom.count({
        where: { clubId: req.user.clubId }
      })
    ]);

    const currentTier = SUBSCRIPTION_TIERS[req.club.subscriptionTier] || SUBSCRIPTION_TIERS.free;

    res.json({
      usage: {
        dancers: dancerCount,
        managers: managerCount,
        vipRooms: vipRoomCount
      },
      limits: {
        maxDancers: currentTier.maxDancers,
        maxManagers: currentTier.maxManagers,
        maxVipRooms: currentTier.maxVipRooms
      },
      percentages: {
        dancers: Math.round((dancerCount / currentTier.maxDancers) * 100),
        managers: Math.round((managerCount / currentTier.maxManagers) * 100),
        vipRooms: Math.round((vipRoomCount / currentTier.maxVipRooms) * 100)
      }
    });

  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;