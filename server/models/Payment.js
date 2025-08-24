import mongoose, { Schema } from 'mongoose';

const PaymentSchema = new Schema(
  {
    bookingId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Booking', 
      required: true 
    },
    provider: {
      type: String,
      enum: ['paystack', 'flutterwave'],
      required: true,
    },
    reference: { 
      type: String, 
      required: true, 
      unique: true 
    },
    amount: { 
      type: Number, 
      required: true,
      min: 100, // Minimum amount in kobo (1 NGN)
      set: val => Math.round(val) // Ensure amount is an integer
    },
    currency: { 
      type: String, 
      default: 'NGN',
      uppercase: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['initialized', 'pending', 'success', 'failed'],
      default: 'initialized',
    },
    paymentDate: { 
      type: Date, 
      default: Date.now 
    },
    channel: {
      type: String,
      enum: ['card', 'bank_transfer', 'ussd', 'qr_code', 'mobile_money', 'bank'],
      default: null
    },
    raw: Schema.Types.Mixed,
    metadata: {
      ip: String,
      userAgent: String,
    },
    failureReason: {
      type: String,
      default: null
    }
  },
  { 
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        // Don't expose raw data in JSON responses
        delete ret.raw;
        return ret;
      }
    }
  }
);

// Virtual for amount in Naira (for display purposes)
PaymentSchema.virtual('amountInNaira').get(function() {
  return this.amount / 100;
});

// Virtual for formatted amount
PaymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: this.currency || 'NGN'
  }).format(this.amount / 100);
});

// Ensure virtuals are included in JSON output
PaymentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.raw;
    return ret;
  }
});

PaymentSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.raw;
    return ret;
  }
});

// Method to update payment status
PaymentSchema.methods.updateStatus = function(status, failureReason = null) {
  this.status = status;
  if (failureReason) {
    this.failureReason = failureReason;
  }
  return this.save();
};

// Index for performance
PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ reference: 1 }, { unique: true });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

export default mongoose.model('Payment', PaymentSchema);