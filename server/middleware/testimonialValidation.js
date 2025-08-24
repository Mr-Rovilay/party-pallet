import { body, validationResult } from 'express-validator';

export const validateTestimonial = [
  body('bookingId')
    .notEmpty().withMessage('Booking ID is required')
    .isMongoId().withMessage('Invalid booking ID format'),
    
  body('feedback')
    .trim()
    .notEmpty().withMessage('Feedback is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Feedback must be between 10 and 1000 characters'),
    
  body('rating')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    
  // Photo validation - only if not uploading a file
  body('photo')
    .optional({ checkFalsy: true })
    .custom((value, { req }) => {
      // If we're uploading a file, skip URL validation
      if (req.file) return true;
      
      // Otherwise validate the URL
      if (!value) return true; // Photo is optional
      
      // Validate URL format
      if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
        throw new Error('Photo must be a valid image URL');
      }
      return true;
    }),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    next();
  }
];

// Validation for updating testimonial (without requiring bookingId)
export const validateTestimonialUpdate = [
  body('feedback')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage('Feedback must be between 10 and 1000 characters'),
    
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    
  body('active')
    .optional()
    .isBoolean().withMessage('Active must be a boolean'),
    
  body('photo')
    .optional({ checkFalsy: true })
    .custom((value, { req }) => {
      // If we're uploading a file, skip URL validation
      if (req.file) return true;
      
      // Otherwise validate the URL
      if (!value) return true; // Photo is optional
      
      // Validate URL format
      if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
        throw new Error('Photo must be a valid image URL');
      }
      return true;
    }),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    next();
  }
];