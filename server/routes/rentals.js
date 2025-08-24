import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';
import { createRental, getRentals, updateRental, deleteRental } from '../controllers/rental.js';
import { restrictTo } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', protect, restrictTo('admin'), upload.array('images', 3), createRental);
router.get('/', getRentals);
router.put('/:id', protect, restrictTo('admin'), upload.array('images', 3), updateRental);
router.delete('/:id', protect, restrictTo('admin'), deleteRental);

export default router;
