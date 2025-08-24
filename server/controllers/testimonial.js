import Testimonial from "../models/Testimonial.js";
import Booking from "../models/Booking.js";
import asyncHandler from 'express-async-handler';

// Create testimonial
export const createTestimonial = asyncHandler(async (req, res) => {
  const { bookingId, feedback, rating } = req.body;
  
  // Validate required fields
  if (!bookingId || !feedback || rating === undefined) {
    return res.status(400).json({ 
      success: false,
      message: "Booking ID, feedback, and rating are required" 
    });
  }
  
  // Validate rating range
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ 
      success: false,
      message: "Rating must be between 1 and 5" 
    });
  }
  
  // Find booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ 
      success: false,
      message: "Booking not found" 
    });
  }
  
  // Check if testimonial already exists for this booking
  const existingTestimonial = await Testimonial.findOne({ booking: bookingId });
  if (existingTestimonial) {
    return res.status(400).json({ 
      success: false,
      message: "A testimonial already exists for this booking" 
    });
  }
  
  // Get photo URL from uploaded file or request body
  let photoUrl = null;
  if (req.file) {
    photoUrl = req.file.path; // Cloudinary URL from multer-storage-cloudinary
  } else if (req.body.photo) {
    photoUrl = req.body.photo;
  }
  
  // Create testimonial
  const testimonial = new Testimonial({
    booking: booking._id,
    clientName: booking.client.fullName,
    feedback,
    rating,
    photo: photoUrl,
  });
  
  // Save testimonial
  await testimonial.save();
  
  // Update booking to include testimonial reference
  booking.testimonials.push(testimonial._id);
  await booking.save();
  
  res.status(201).json({
    success: true,
    message: "Testimonial created successfully",
    testimonial
  });
});

// Get all testimonials (with booking info)
export const getTestimonials = asyncHandler(async (req, res) => {
  const { active, rating, page = 1, limit = 10 } = req.query;
  
  // Build filter
  const filter = {};
  if (active !== undefined) {
    filter.active = active === 'true';
  }
  if (rating !== undefined) {
    filter.rating = parseInt(rating);
  }
  
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const testimonials = await Testimonial.find(filter)
    .populate({
      path: 'booking',
      select: 'event.type event.date client',
      populate: {
        path: 'client',
        select: 'fullName email'
      }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Testimonial.countDocuments(filter);
  
  res.json({
    success: true,
    testimonials,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// Get single testimonial
export const getTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id)
    .populate({
      path: 'booking',
      select: 'event.type event.date client',
      populate: {
        path: 'client',
        select: 'fullName email'
      }
    });
  
  if (!testimonial) {
    return res.status(404).json({ 
      success: false,
      message: "Testimonial not found" 
    });
  }
  
  res.json({
    success: true,
    testimonial
  });
});

// Update testimonial (admin only)
export const updateTestimonial = asyncHandler(async (req, res) => {
  const { feedback, rating, active } = req.body;
  
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) {
    return res.status(404).json({ 
      success: false,
      message: "Testimonial not found" 
    });
  }
  
  // Update fields
  if (feedback !== undefined) testimonial.feedback = feedback;
  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        message: "Rating must be between 1 and 5" 
      });
    }
    testimonial.rating = rating;
  }
  if (active !== undefined) testimonial.active = active;
  
  // Handle photo update
  if (req.file) {
    // If a new file is uploaded, use that URL
    testimonial.photo = req.file.path;
  } else if (req.body.photo !== undefined) {
    // If photo URL is provided in body, use that
    testimonial.photo = req.body.photo;
  }
  
  await testimonial.save();
  
  res.json({
    success: true,
    message: "Testimonial updated successfully",
    testimonial
  });
});

// Delete testimonial
export const deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) {
    return res.status(404).json({ 
      success: false,
      message: "Testimonial not found" 
    });
  }
  
  // Remove testimonial reference from booking
  await Booking.findByIdAndUpdate(testimonial.booking, {
    $pull: { testimonials: testimonial._id }
  });
  
  // Delete testimonial
  await Testimonial.findByIdAndDelete(req.params.id);
  
  res.json({
    success: true,
    message: "Testimonial deleted successfully"
  });
});