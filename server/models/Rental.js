import mongoose from 'mongoose';

// Define image schema to prevent _id generation for subdocuments
const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  caption: { type: String, default: "" }
}, { _id: false });

const rentalSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  images: [imageSchema],
  basePrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ["Decorations", "Furniture", "Lighting", "Tableware", "Other"],
    default: "Other"
  },
  tags: [String],
  active: { 
    type: Boolean, 
    default: true 
  },
  featured: {
    type: Boolean,
    default: false
  },
  inStock: {
    type: Boolean,
    default: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted price
rentalSchema.virtual('formattedPrice').get(function() {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(this.basePrice);
});

// Virtual for image count
rentalSchema.virtual('imageCount').get(function() {
  return this.images.length;
});

// Index for performance
rentalSchema.index({ active: 1, category: 1 });
rentalSchema.index({ tags: 1 });
rentalSchema.index({ featured: 1, active: 1 });

export default mongoose.model('Rental', rentalSchema);