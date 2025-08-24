import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';
import { 
  createBooking, 
  getAllBookings, 
  getBookingById, 
  getBookingPaymentDetails, 
  updateBookingStatus,
  updateBooking,
  cancelBooking
} from '../controllers/booking.js';
import { bookingLimiter } from '../middleware/security.js';
import { 
  validateBooking, 
  validateBookingUpdate, 
  validateStatusUpdate,
  validateCancellation 
} from '../middleware/bookingValidation.js';
import { sanitizeData } from '../middleware/sanitize.js';

const router = express.Router();

// Apply security middleware to all routes
router.use(sanitizeData);

// Public route with rate limiting and validation
router.post('/', bookingLimiter, validateBooking, createBooking);

// Admin routes
router.get('/', protect, restrictTo('admin'), getAllBookings);
router.get('/:id', getBookingById);
router.get('/:id/payment-details', protect, getBookingPaymentDetails);

// Admin only routes
router.patch('/:id/status', protect, restrictTo('admin'), validateStatusUpdate, updateBookingStatus);
router.patch('/:id', protect, restrictTo('admin'), validateBookingUpdate, updateBooking);
router.patch('/:id/cancel', protect, restrictTo('admin'), validateCancellation, cancelBooking);

export default router;