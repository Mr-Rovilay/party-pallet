import mongoose from 'mongoose';

const rentalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  images: [
    {
      url: { type: String, required: true },       // cloudinary URL
      public_id: { type: String, required: true }  // cloudinary public_id
    }
  ],
  basePrice: { type: Number, required: true },
  tags: [String],
  active: { type: Boolean, default: true },
}, { timestamps: true });


export default mongoose.model('Rental', rentalSchema);