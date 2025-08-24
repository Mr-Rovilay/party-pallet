import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  publicId: { type: String, required: true },
  url: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  caption: { type: String, default: "" }
}, { _id: false }); // Disable _id for subdocuments

const portfolioSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true, 
      minlength: 3,
      maxlength: 100,
      trim: true
    },
    category: {
      type: String,
      enum: [
        "Birthday",
        "Bridal Shower",
        "Baby Shower",
        "House",
        "Hall",
        "Other",
      ],
      default: "Other",
    },
    images: [imageSchema], // Use the separate schema
    description: { 
      type: String, 
      maxlength: 1000,
      trim: true
    },
    featured: { 
      type: Boolean, 
      default: false 
    },
    shotDate: Date,
    location: { 
      type: String, 
      maxlength: 100,
      trim: true
    },
    tags: [String],
    isPublished: { 
      type: Boolean, 
      default: true 
    },
    viewCount: {
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for formatted date
portfolioSchema.virtual('formattedShotDate').get(function() {
  return this.shotDate ? this.shotDate.toLocaleDateString() : null;
});

// Virtual for image count
portfolioSchema.virtual('imageCount').get(function() {
  return this.images.length;
});

// Index for performance
portfolioSchema.index({ category: 1, isPublished: 1 });
portfolioSchema.index({ featured: 1, isPublished: 1 });
portfolioSchema.index({ createdAt: -1 });

export default mongoose.model("Portfolio", portfolioSchema);