import express from 'express';
import { 
  handleWebhook, 
  initializePayment,
  verifyPayment,
  getPaymentByBookingId,
  retryPayment
} from '../controllers/payment.js';
import { paymentLimiter, apiLimiter } from '../middleware/security.js';
import { sanitizeData } from '../middleware/sanitize.js';

const router = express.Router();

// Apply security middleware to all routes
router.use(sanitizeData);
router.use(apiLimiter); // General rate limiting for all payment routes

// Public routes with specific rate limiting
router.post('/initialize', paymentLimiter, initializePayment);
router.post('/retry', paymentLimiter, retryPayment);

// Webhook route (no rate limiting as it's called by Paystack)
router.post('/webhook', handleWebhook);

// Verification routes
router.get('/verify/:reference', verifyPayment);
router.get('/booking/:bookingId', getPaymentByBookingId);

export default router;