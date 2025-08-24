import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';
import { restrictTo } from '../middleware/roleMiddleware.js';
import { 
  createPortfolioItem, 
  deletePortfolioItem, 
  getPortfolioItems, 
  getPortfolioItem,
  getFeaturedPortfolioItems,
  getPortfolioCategories,
  updatePortfolioItem 
} from '../controllers/portfolio.js';

const router = express.Router();

// Public routes
router.get('/', getPortfolioItems);
router.get('/featured', getFeaturedPortfolioItems);
router.get('/categories', getPortfolioCategories);
router.get('/:id', getPortfolioItem);

// Admin routes
router.post('/', 
  protect, 
  restrictTo('admin'), 
  upload.array('images', 10), // Increased limit to 10 images
  createPortfolioItem
);

router.patch('/:id', 
  protect, 
  restrictTo('admin'), 
  upload.array('images', 10), // Increased limit to 10 images
  updatePortfolioItem
);

router.delete('/:id', protect, restrictTo('admin'), deletePortfolioItem);

export default router;