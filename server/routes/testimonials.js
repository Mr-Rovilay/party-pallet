import express from "express";
import {
  createTestimonial,
  getTestimonials,
  getTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/testimonial.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import upload, { handleUploadErrors } from "../middleware/upload.js";
import { validateTestimonial, validateTestimonialUpdate } from "../middleware/testimonialValidation.js";

const router = express.Router();

// Public routes
router.post("/", 
  upload.single('photo'), 
  handleUploadErrors, 
  validateTestimonial, 
  createTestimonial
);

router.get("/", getTestimonials);
router.get("/:id", getTestimonial);

// Admin routes
router.patch("/:id", 
  protect, 
  restrictTo("admin"), 
  upload.single('photo'), 
  handleUploadErrors, 
  validateTestimonialUpdate, 
  updateTestimonial
);

router.delete("/:id", protect, restrictTo("admin"), deleteTestimonial);

export default router;