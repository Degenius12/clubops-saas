const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Club = require('../models/Club');
const { auth, authorize } = require('../middleware/auth');

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
    const club = await Club.findById(req.user.clubId);
    
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const currentTier = SUBSCRIPTION_TIERS[club.subscription.tier];
    
    res.json({
      subscription: club.subscription,
      tierInfo: currentTier,
      usage: club.usage,
      limits: club.limits
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

    const club = await Club.findById(req.user.clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const tierInfo = SUBSCRIPTION_TIERS[tier];
    
    // Create or retrieve Stripe customer
    let customerId = club.subscription.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.fullUser.email,
        name: `${req.fullUser.firstName} ${req.fullUser.lastName}`,
        metadata: {
          clubId: club._id.toString(),
          clubName: club.name
        }
      });
      customerId = customer.id;
      
      // Update club with customer ID
      club.subscription.stripeCustomerId = customerId;
      await club.save();
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
      success_url: `${process.env.CLIENT_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard/subscription/pricing`,
      metadata: {
        clubId: club._id.toString(),
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

// @route   POST /api/subscriptions/webhook
// @desc    Handle Stripe webhooks
// @access  Public (but verified)
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

// Webhook handlers
async function handleCheckoutCompleted(session) {
  const clubId = session.metadata.clubId;
  const tier = session.metadata.tier;
  
  const club = await Club.findById(clubId);
  if (!club) return;

  const tierInfo = SUBSCRIPTION_TIERS[tier];
  
  // Update club subscription
  club.subscription = {
    ...club.subscription,
    tier: tier,
    status: 'active',
    stripeSubscriptionId: session.subscription
  };
  
  // Update limits based on new tier
  club.limits = {
    maxDancers: tierInfo.maxDancers,
    maxManagers: tierInfo.maxManagers,
    maxVipRooms: tierInfo.maxVipRooms,
    storageGB: tierInfo.storageGB,
    monthlyReports: tier !== 'free'
  };
  
  await club.save();
}

async function handleSubscriptionUpdated(subscription) {
  const club = await Club.findOne({ 'subscription.stripeSubscriptionId': subscription.id });
  if (!club) return;

  club.subscription.status = subscription.status;
  club.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
  club.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  club.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
  
  await club.save();
}

async function handleSubscriptionDeleted(subscription) {
  const club = await Club.findOne({ 'subscription.stripeSubscriptionId': subscription.id });
  if (!club) return;

  // Downgrade to free tier
  club.subscription.tier = 'free';
  club.subscription.status = 'cancelled';
  club.limits = {
    maxDancers: SUBSCRIPTION_TIERS.free.maxDancers,
    maxManagers: SUBSCRIPTION_TIERS.free.maxManagers,
    maxVipRooms: SUBSCRIPTION_TIERS.free.maxVipRooms,
    storageGB: SUBSCRIPTION_TIERS.free.storageGB,
    monthlyReports: false
  };
  
  await club.save();
}

async function handlePaymentFailed(invoice) {
  const club = await Club.findOne({ 'subscription.stripeCustomerId': invoice.customer });
  if (!club) return;

  // Suspend subscription after payment failure
  club.subscription.status = 'suspended';
  await club.save();
  
  // TODO: Send notification email to club owner
}

module.exports = router;