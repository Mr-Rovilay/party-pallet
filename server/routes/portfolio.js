import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
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
import { upload } from '../config/portfolioUpload.js';
import { handleUploadErrors } from '../middleware/upload.js';

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
  upload.array('images', 10), // Up to 10 images
  handleUploadErrors,
  createPortfolioItem
);

router.patch('/:id', 
  protect, 
  restrictTo('admin'), 
  upload.array('images', 10), // Up to 10 images
  handleUploadErrors,
  updatePortfolioItem
);

router.delete('/:id', protect, restrictTo('admin'), deletePortfolioItem);

export default router;