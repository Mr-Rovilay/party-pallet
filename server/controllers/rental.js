import Rental from '../models/Rental.js';
import { cloudinary } from '../config/cloudinary.js';
import asyncHandler from 'express-async-handler';

// Create rental item (admin only)
export const createRental = asyncHandler(async (req, res) => {
  const { name, description, basePrice, category, tags, active, featured, inStock, quantity } = req.body;
  
  // Validate required fields
  if (!name || !description) {
    return res.status(400).json({ 
      success: false,
      message: 'Name and description are required' 
    });
  }
  
  // Check if images were uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'At least one image is required' 
    });
  }
  
  // Process images
  const images = req.files.map(file => ({
    url: file.secure_url || file.path,
    public_id: file.public_id || file.filename,
    caption: ""
  }));
  
  // Create rental
  const rental = new Rental({
    name,
    description,
    images,
    basePrice: basePrice || 0,
    category: category || "Other",
    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    active: active !== undefined ? active : true,
    featured: featured !== undefined ? featured : false,
    inStock: inStock !== undefined ? inStock : true,
    quantity: quantity || 1
  });
  
  await rental.save();
  
  res.status(201).json({ 
    success: true,
    message: 'Rental created successfully',
    rental 
  });
});

// Get all rentals (public)
export const getRentals = asyncHandler(async (req, res) => {
  const { 
    tags, 
    category, 
    featured, 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;
  
  // Build query
  const query = { active: true };
  
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : tags.split(',');
    query.tags = { $in: tagArray };
  }
  
  if (category) query.category = category;
  if (featured === 'true') query.featured = true;
  
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  // Execute query
  const rentals = await Rental.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .select("-__v");
  
  // Get total count for pagination
  const total = await Rental.countDocuments(query);
  
  res.status(200).json({
    success: true,
    rentals,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit)
    }
  });
});

// Get single rental (public)
export const getRental = asyncHandler(async (req, res) => {
  const rental = await Rental.findById(req.params.id);
  
  if (!rental) {
    return res.status(404).json({ 
      success: false,
      message: 'Rental not found' 
    });
  }
  
  res.status(200).json({
    success: true,
    rental
  });
});

// Get featured rentals (public)
export const getFeaturedRentals = asyncHandler(async (req, res) => {
  const featuredRentals = await Rental.find({ 
    active: true, 
    featured: true,
    inStock: true
  })
  .sort({ createdAt: -1 })
  .limit(6)
  .select("-__v");
  
  res.status(200).json({
    success: true,
    rentals: featuredRentals
  });
});

// Get rental categories (public)
export const getRentalCategories = asyncHandler(async (req, res) => {
  // Get unique categories from active rentals
  const categories = await Rental.distinct('category', { active: true });
  
  // Count items in each category
  const categoryCounts = await Rental.aggregate([
    { $match: { active: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  res.status(200).json({
    success: true,
    categories: categoryCounts
  });
});

// Update rental (admin only)
export const updateRental = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, basePrice, category, tags, active, featured, inStock, quantity } = req.body;
  
  const rental = await Rental.findById(id);
  
  if (!rental) {
    return res.status(404).json({ 
      success: false,
      message: 'Rental not found' 
    });
  }
  
  // Update fields
  if (name !== undefined) rental.name = name;
  if (description !== undefined) rental.description = description;
  if (basePrice !== undefined) rental.basePrice = basePrice;
  if (category !== undefined) rental.category = category;
  if (tags !== undefined) rental.tags = tags.split(',').map(tag => tag.trim());
  if (active !== undefined) rental.active = active;
  if (featured !== undefined) rental.featured = featured;
  if (inStock !== undefined) rental.inStock = inStock;
  if (quantity !== undefined) rental.quantity = quantity;
  
  // Handle new images if uploaded
  if (req.files && req.files.length > 0) {
    // Delete old images from Cloudinary
    for (const image of rental.images) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }
    
    // Add new images
    rental.images = req.files.map(file => ({
      url: file.secure_url || file.path,
      public_id: file.public_id || file.filename,
      caption: ""
    }));
  }
  
  await rental.save();
  
  res.status(200).json({ 
    success: true,
    message: 'Rental updated successfully',
    rental 
  });
});

// Delete rental (admin only)
export const deleteRental = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const rental = await Rental.findById(id);
  
  if (!rental) {
    return res.status(404).json({ 
      success: false,
      message: 'Rental not found' 
    });
  }
  
  // Delete images from Cloudinary
  for (const image of rental.images) {
    try {
      await cloudinary.uploader.destroy(image.public_id);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  }
  
  await Rental.findByIdAndDelete(id);
  
  res.status(200).json({ 
    success: true,
    message: 'Rental deleted successfully' 
  });
});