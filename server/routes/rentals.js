import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';
import { restrictTo } from '../middleware/roleMiddleware.js';
import { 
  createRental, 
  getRentals, 
  getRental,
  getFeaturedRentals,
  getRentalCategories,
  updateRental, 
  deleteRental 
} from '../controllers/rental.js';

const router = express.Router();

// Public routes
router.get('/', getRentals);
router.get('/featured', getFeaturedRentals);
router.get('/categories', getRentalCategories);
router.get('/:id', getRental);

// Admin routes
router.post('/', 
  protect, 
  restrictTo('admin'), 
  upload.array('images', 10), // Increased limit to 10 images
  createRental
);

router.put('/:id', 
  protect, 
  restrictTo('admin'), 
  upload.array('images', 10), // Increased limit to 10 images
  updateRental
);

router.delete('/:id', protect, restrictTo('admin'), deleteRental);

export default router;