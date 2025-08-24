const mongoose = require('mongoose');

const dancerSchema = new mongoose.Schema({
  // Multi-tenant: Link to club
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  
  // Personal Information
  stageName: {
    type: String,
    required: true,
    trim: true
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
  dateOfBirth: {
    type: Date,
    required: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  // Address Information
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  
  // License and Compliance (Core ClubOps feature)
  license: {
    number: {
      type: String,
      required: true,
      unique: true
    },
    type: {
      type: String,
      enum: ['entertainer', 'adult_entertainer', 'performer'],
      default: 'entertainer'
    },
    issueDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    issuingAuthority: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'suspended', 'pending'],
      default: 'pending'
    }
  },
  
  // Employment Status
  employmentStatus: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'on_leave'],
    default: 'active'
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  
  // Contract and Documents
  contractSigned: {
    type: Boolean,
    default: false
  },
  contractDate: Date,
  
  // Performance Tracking
  preferences: {
    preferredShifts: [String],
    musicGenres: [String],
    specialRequests: String
  },
  
  // Financial Tracking
  fees: {
    standardBarFee: {
      type: Number,
      default: 0
    },
    customBarFee: Number,
    totalFeesCollected: {
      type: Number,
      default: 0
    },
    outstandingBalance: {
      type: Number,
      default: 0
    }
  },
  
  // Check-in/Check-out History
  currentShift: {
    isCheckedIn: {
      type: Boolean,
      default: false
    },
    checkInTime: Date,
    barFeePaid: {
      type: Boolean,
      default: false
    },
    amountPaid: Number,
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'deferred'],
      default: 'cash'
    }
  },
  
  // Status and Notes
  notes: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
dancerSchema.index({ clubId: 1, stageName: 1 });
dancerSchema.index({ clubId: 1, 'license.expiryDate': 1 });
dancerSchema.index({ clubId: 1, employmentStatus: 1 });
dancerSchema.index({ 'license.number': 1 }, { unique: true });

// Virtual for license status warning
dancerSchema.virtual('licenseWarning').get(function() {
  const today = new Date();
  const warningDate = new Date(this.license.expiryDate);
  warningDate.setDate(warningDate.getDate() - 14); // 14 days before expiry
  
  return today >= warningDate && today < this.license.expiryDate;
});

module.exports = mongoose.model('Dancer', dancerSchema);