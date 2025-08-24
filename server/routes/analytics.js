import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getAnalytics, getMonthlyReport } from '../controllers/analytics.js';
import { restrictTo } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Get dashboard analytics
router.get('/', protect, restrictTo('admin'), getAnalytics);

// Get detailed monthly report
router.get('/monthly', protect, restrictTo('admin'), getMonthlyReport);

export default router;