import mongoose from 'mongoose';
import moment from 'moment';

const availabilitySchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true,
    set: val => moment(val).startOf('day').toDate()
  },
  isAvailable: { type: Boolean, default: true },
  slots: [
    {
      start: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Start time must be in HH:mm format'
        }
      },
      end: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'End time must be in HH:mm format'
        }
      },
      status: {
        type: String,
        enum: ['available', 'blocked', 'booked'],
        default: 'available',
      },
      note: String,
    },
  ],
    default: [] // ✅ ensure always an array
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.date = moment(ret.date).format('YYYY-MM-DD');
      return ret;
    }
  }
});

// Ensure unique dates
availabilitySchema.index({ date: 1 }, { unique: true });
// Add text index for searching notes
availabilitySchema.index({ "slots.note": "text" });

// Pre-save hook to validate slots
availabilitySchema.pre('save', function(next) {
  // Check for overlapping slots
  const sortedSlots = [...this.slots].sort((a, b) => {
    return a.start.localeCompare(b.start);
  });
  
  for (let i = 0; i < sortedSlots.length - 1; i++) {
    const currentSlot = sortedSlots[i];
    const nextSlot = sortedSlots[i + 1];
    
    if (nextSlot.start < currentSlot.end) {
      const error = new Error('Time slots must not overlap');
      return next(error);
    }
  }
  
  next();
});

export default mongoose.model('Availability', availabilitySchema);