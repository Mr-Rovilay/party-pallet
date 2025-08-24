import { body, validationResult } from 'express-validator';
import moment from 'moment';

export const validateBooking = [
  // Client validation
  body('client.fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
    
  body('client.email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
    
  body('client.phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  
  // Event validation
  body('event.type')
    .isIn(['Birthday', 'Bridal Shower', 'Baby Shower', 'House', 'Hall', 'Other'])
    .withMessage('Invalid event type'),
    
  body('event.date')
    .isISO8601()
    .withMessage('Date must be in ISO format')
    .custom(value => {
      if (moment(value).isBefore(moment().startOf('day'))) {
        throw new Error('Event date must be in the future');
      }
      return true;
    }),
    
  body('event.startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format'),
    
  body('event.endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format')
    .custom((value, { req }) => {
      const startTime = req.body.event.startTime;
      const endTime = value;
      
      // Convert times to minutes since midnight
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      const startTotalMinutes = startHours * 60 + startMinutes;
      let endTotalMinutes = endHours * 60 + endMinutes;
      
      // If end time is less than start time, assume it's the next day
      if (endTotalMinutes <= startTotalMinutes) {
        endTotalMinutes += 24 * 60; // Add 24 hours in minutes
      }
      
      // Check if end time is at least 30 minutes after start time
      if (endTotalMinutes - startTotalMinutes < 30) {
        throw new Error('Event duration must be at least 30 minutes');
      }
      
      // Check if duration is reasonable (less than 24 hours)
      if (endTotalMinutes - startTotalMinutes > 24 * 60) {
        throw new Error('Event duration cannot exceed 24 hours');
      }
      
      return true;
    }),
    
  body('event.location')
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Location must be between 5 and 100 characters'),
  
  // Pricing validation
  body('pricing.estimate')
    .isFloat({ min: 0 })
    .withMessage('Estimate must be a positive number'),
    
  body('pricing.depositRequired')
    .isFloat({ min: 0 })
    .withMessage('Deposit must be a positive number')
    .custom((value, { req }) => {
      if (value > req.body.pricing.estimate) {
        throw new Error('Deposit cannot exceed the estimated amount');
      }
      return true;
    }),
  
  // Handle validation errors
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

export const validateBookingUpdate = [
  // Event validation (optional fields)
  body('event.date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in ISO format')
    .custom(value => {
      if (moment(value).isBefore(moment().startOf('day'))) {
        throw new Error('Event date must be in the future');
      }
      return true;
    }),
    
  body('event.startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format'),
    
  body('event.endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format')
    .custom((value, { req }) => {
      if (req.body.event.startTime) {
        const startTime = req.body.event.startTime;
        const endTime = value;
        
        // Convert times to minutes since midnight
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        
        const startTotalMinutes = startHours * 60 + startMinutes;
        let endTotalMinutes = endHours * 60 + endMinutes;
        
        // If end time is less than start time, assume it's the next day
        if (endTotalMinutes <= startTotalMinutes) {
          endTotalMinutes += 24 * 60; // Add 24 hours in minutes
        }
        
        // Check if end time is at least 30 minutes after start time
        if (endTotalMinutes - startTotalMinutes < 30) {
          throw new Error('Event duration must be at least 30 minutes');
        }
        
        // Check if duration is reasonable (less than 24 hours)
        if (endTotalMinutes - startTotalMinutes > 24 * 60) {
          throw new Error('Event duration cannot exceed 24 hours');
        }
      }
      return true;
    }),
  
  // Pricing validation (optional fields)
  body('pricing.estimate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimate must be a positive number'),
    
  body('pricing.depositRequired')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deposit must be a positive number')
    .custom((value, { req }) => {
      if (req.body.pricing.estimate && value > req.body.pricing.estimate) {
        throw new Error('Deposit cannot exceed the estimated amount');
      }
      return true;
    }),
  
  // Handle validation errors
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

export const validateStatusUpdate = [
  body('status')
    .isIn(['pending', 'deposit-paid', 'confirmed', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
    
  body('note')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Note must be less than 200 characters'),
  
  // Handle validation errors
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

export const validateCancellation = [
  body('reason')
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5 and 200 characters'),
  
  // Handle validation errors
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