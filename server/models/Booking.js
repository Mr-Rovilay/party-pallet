import mongoose from "mongoose";
import moment from "moment";

const bookingSchema = new mongoose.Schema(
  {
    client: {
      fullName: { type: String, required: true, trim: true },
      email: { 
        type: String, 
        required: true, 
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
      },
      phone: { 
        type: String, 
        required: true,
        trim: true
      },
    },
    event: {
      type: {
        type: String,
        enum: [
          "Birthday",
          "Bridal Shower",
          "Baby Shower",
          "House",
          "Hall",
          "Other",
        ],
        required: true,
      },
      title: { type: String, trim: true },
      location: { type: String, required: true, trim: true },
      date: { type: Date, required: true },
      startTime: {
        type: String,
        required: true,
        match: [
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "Start time must be HH:mm",
        ],
      },
      endTime: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be HH:mm"],
      },
      consultationMode: {
        type: String,
        enum: ["in-person", "whatsapp", "video-call"],
        default: "whatsapp",
      },
      notes: { type: String, trim: true },
    },
    pricing: {
      estimate: { type: Number, required: true, min: 0 },
      overnightSurcharge: { type: Number, default: 0, min: 0 },
      depositRequired: { type: Number, required: true, min: 0 },
      currency: { type: String, default: "NGN" },
      finalAgreed: { type: Number, min: 0 },
    },
    notes: { type: String, trim: true },
    isOvernight: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "deposit-paid", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: { type: String, trim: true }
      },
    ],
    payment: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }],
    testimonials: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Testimonial" },
    ],
    cancellationReason: { type: String, trim: true, default: null },
    cancellationDate: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for event duration
bookingSchema.virtual("event.duration").get(function () {
  const dateStr = moment(this.event.date).format("YYYY-MM-DD");
  const start = moment(`${dateStr} ${this.event.startTime}`, "YYYY-MM-DD HH:mm");
  let end = moment(`${dateStr} ${this.event.endTime}`, "YYYY-MM-DD HH:mm");
  
  // Handle overnight events
  if (end.isBefore(start)) {
    end.add(1, "day");
  }
  
  return end.diff(start, "hours");
});

// Virtual for total amount
bookingSchema.virtual("pricing.totalAmount").get(function () {
  return this.pricing.estimate + this.pricing.overnightSurcharge;
});

// Virtual for remaining balance
bookingSchema.virtual("pricing.remainingBalance").get(function () {
  return this.pricing.totalAmount - this.pricing.depositRequired;
});

// Pre-save hook to update status history and calculate overnight
bookingSchema.pre("save", function (next) {
  // Update status history
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this._changedBy || null, // Set in controller
      note: this._statusChangeNote || null // Set in controller
    });
  }
  
  // Calculate overnight status if not set
  if (this.isModified("event.endTime") || this.isModified("event.startTime") || this.isNew) {
    const dateStr = moment(this.event.date).format("YYYY-MM-DD");
    const start = moment(`${dateStr} ${this.event.startTime}`, "YYYY-MM-DD HH:mm");
    const end = moment(`${dateStr} ${this.event.endTime}`, "YYYY-MM-DD HH:mm");
    
    // Check if event is overnight (ends after midnight or duration > 12 hours)
    const isOvernight = end.hour() < 6 || end.diff(start, 'hours') > 12;
    
    if (isOvernight !== this.isOvernight) {
      this.isOvernight = isOvernight;
      
      // Calculate overnight surcharge if not set (20% of estimate)
      if (isOvernight && (!this.pricing.overnightSurcharge || this.pricing.overnightSurcharge === 0)) {
        this.pricing.overnightSurcharge = this.pricing.estimate * 0.2;
      } else if (!isOvernight && this.pricing.overnightSurcharge > 0) {
        this.pricing.overnightSurcharge = 0;
      }
    }
  }
  
  next();
});

// Method to cancel booking
bookingSchema.methods.cancel = function(reason, cancelledBy) {
  this.status = "cancelled";
  this.cancellationReason = reason;
  this.cancellationDate = new Date();
  this._statusChangeNote = reason;
  this._changedBy = cancelledBy;
  
  return this.save();
};

// Index for performance
bookingSchema.index({
  "event.date": 1,
  "event.startTime": 1,
  "event.endTime": 1,
});

bookingSchema.index({ "client.email": 1 });
bookingSchema.index({ status: 1 });

export default mongoose.model("Booking", bookingSchema);