import mongoose from "mongoose";

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
    images: [{ 
      publicId: String, 
      url: String, 
      width: Number, 
      height: Number,
      caption: String // Added caption for each image
    }],
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
    tags: [String], // Added tags for better categorization
    isPublished: { 
      type: Boolean, 
      default: true 
    },
    viewCount: { // Added view count for popularity tracking
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