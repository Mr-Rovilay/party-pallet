import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    feedback: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, "Feedback cannot exceed 1000 characters"],
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      required: true,
    },
    photo: {
      //can we use cloudinary so they ca upload optionlaly
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: "Invalid photo URL format"
      }
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for performance
testimonialSchema.index({ booking: 1 });
testimonialSchema.index({ rating: -1 });
testimonialSchema.index({ active: 1 });

export default mongoose.model("Testimonial", testimonialSchema);