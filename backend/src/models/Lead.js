const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    whatsapp: {
      type: String,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    adults: {
      type: Number,
      default: 1,
      min: 1,
    },
    children: {
      type: Number,
      default: 0,
      min: 0,
    },
    budget: {
      type: Number,
    },
    tripType: {
      type: String,
      enum: ['Family', 'Honeymoon', 'Solo', 'Group', 'Corporate', 'Luxury', 'Other'],
      default: 'Family',
    },
    source: {
      type: String,
      enum: [
        'Meta/Facebook Ads',
        'Instagram',
        'WhatsApp',
        'Website',
        'Referral',
        'Existing Customer',
        'Walk-in',
        'Other',
      ],
      required: [true, 'Lead source is required'],
      index: true,
    },
    campaignName: {
      type: String,
      trim: true,
    },
    adName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'New',
        'Contacted',
        'Follow-up Required',
        'Interested',
        'Quote Sent',
        'Negotiation',
        'Booked',
        'Lost',
        'Not Interested',
      ],
      default: 'New',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastContactedAt: {
      type: Date,
    },
    nextFollowUpDate: {
      type: Date,
      index: true,
    },
    estimatedValue: {
      type: Number,
      default: 0,
    },
    actualBookingValue: {
      type: Number,
      default: 0,
    },
    quoteDate: {
      type: Date,
    },
    quoteAmount: {
      type: Number,
    },
    quoteNotes: {
      type: String,
    },
    bookingDate: {
      type: Date,
    },
    lostReason: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lead', leadSchema);
