const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['owner', 'manager', 'dj', 'security'],
    default: 'manager'
  },
  // Multi-tenant: Link to club
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  // User permissions within the club
  permissions: {
    dancerManagement: { type: Boolean, default: false },
    financialReports: { type: Boolean, default: false },
    djQueue: { type: Boolean, default: false },
    vipRooms: { type: Boolean, default: false },
    settings: { type: Boolean, default: false }
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Profile settings
  preferences: {
    theme: { type: String, default: 'dark' },
    notifications: { type: Boolean, default: true },
    language: { type: String, default: 'en' }
  }
}, {
  timestamps: true
});

// Index for multi-tenant queries
userSchema.index({ clubId: 1, email: 1 });
userSchema.index({ clubId: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);