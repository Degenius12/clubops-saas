const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'US' }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  // SaaS Subscription Management
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'cancelled', 'trial'],
      default: 'trial'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    trialEndsAt: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false }
  },
  // Feature limits based on subscription
  limits: {
    maxDancers: { type: Number, default: 10 }, // Free tier limit
    maxManagers: { type: Number, default: 2 },
    maxVipRooms: { type: Number, default: 3 },
    storageGB: { type: Number, default: 1 },
    monthlyReports: { type: Boolean, default: false }
  },
  // Usage tracking for billing
  usage: {
    currentDancers: { type: Number, default: 0 },
    currentManagers: { type: Number, default: 1 },
    storageUsedMB: { type: Number, default: 0 },
    apiCallsThisMonth: { type: Number, default: 0 }
  },
  // Club operational settings
  settings: {
    timezone: { type: String, default: 'America/New_York' },
    currency: { type: String, default: 'USD' },
    defaultBarFee: { type: Number, default: 20 },
    vipRoomRate: { type: Number, default: 30 },
    // License compliance settings
    licenseExpiryWarningDays: { type: Number, default: 14 },
    requireLicenseForQueue: { type: Boolean, default: true }
  },
  // Club status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
clubSchema.index({ 'subscription.status': 1 });
clubSchema.index({ 'subscription.tier': 1 });
clubSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Club', clubSchema);