import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';
import { 
  getAvailability, 
  setAvailability, 
  blockSlot, 
  deleteAvailability
} from '../controllers/availability.js';
import moment from 'moment';

const router = express.Router();

// Set availability (admin only)
router.post('/', protect, restrictTo('admin'), setAvailability);

// Block specific time slot (admin only)
router.post('/block', protect, restrictTo('admin'), blockSlot);

// Get availability (public) - can handle single date or date range
router.get('/', getAvailability);

// Delete availability (admin only)
router.delete('/:date', protect, restrictTo('admin'), deleteAvailability);

export default router;