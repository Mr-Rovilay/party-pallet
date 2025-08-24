import { cloudinary } from '../config/cloudinary.js';
import Portfolio from '../models/Portfolio.js';
import asyncHandler from 'express-async-handler';

// Create portfolio item (admin only)
export const createPortfolioItem = asyncHandler(async (req, res) => {
  const { title, category, description, shotDate, location, isPublished, featured, tags } = req.body;
  
  // Validate required fields
  if (!title || !category) {
    return res.status(400).json({ 
      success: false,
      message: 'Title and category are required' 
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
    publicId: file.public_id,
    url: file.secure_url,
    width: file.width,
    height: file.height,
    caption: '' // Default empty caption
  }));
  
  // Create portfolio item
  const portfolio = new Portfolio({
    title,
    category,
    images,
    description,
    shotDate: shotDate ? new Date(shotDate) : undefined,
    location,
    isPublished: isPublished !== undefined ? isPublished : true,
    featured: featured !== undefined ? featured : false,
    tags: tags ? tags.split(',').map(tag => tag.trim()) : []
  });
  
  await portfolio.save();
  
  res.status(201).json({ 
    success: true,
    message: 'Portfolio item created successfully',
    portfolio 
  });
});

// Get all portfolio items (public)
export const getPortfolioItems = asyncHandler(async (req, res) => {
  const { 
    category, 
    featured, 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;
  
  // Build query
  const query = { isPublished: true };
  
  if (category) query.category = category;
  if (featured === 'true') query.featured = true;
  
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  // Execute query
  const portfolios = await Portfolio.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));
  
  // Get total count for pagination
  const total = await Portfolio.countDocuments(query);
  
  res.status(200).json({
    success: true,
    portfolios,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit)
    }
  });
});

// Get single portfolio item (public)
export const getPortfolioItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const portfolio = await Portfolio.findById(id);
  
  if (!portfolio) {
    return res.status(404).json({ 
      success: false,
      message: 'Portfolio item not found' 
    });
  }
  
  // Increment view count
  portfolio.viewCount += 1;
  await portfolio.save();
  
  res.status(200).json({
    success: true,
    portfolio
  });
});

// Get featured portfolio items (public)
export const getFeaturedPortfolioItems = asyncHandler(async (req, res) => {
  const featuredItems = await Portfolio.find({ 
    isPublished: true, 
    featured: true 
  })
  .sort({ viewCount: -1, createdAt: -1 })
  .limit(6);
  
  res.status(200).json({
    success: true,
    portfolios: featuredItems
  });
});

// Update portfolio item (admin only)
export const updatePortfolioItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, category, description, shotDate, location, isPublished, featured, tags } = req.body;
  
  const portfolio = await Portfolio.findById(id);
  
  if (!portfolio) {
    return res.status(404).json({ 
      success: false,
      message: 'Portfolio item not found' 
    });
  }
  
  // Update fields
  if (title !== undefined) portfolio.title = title;
  if (category !== undefined) portfolio.category = category;
  if (description !== undefined) portfolio.description = description;
  if (shotDate !== undefined) portfolio.shotDate = shotDate ? new Date(shotDate) : portfolio.shotDate;
  if (location !== undefined) portfolio.location = location;
  if (isPublished !== undefined) portfolio.isPublished = isPublished;
  if (featured !== undefined) portfolio.featured = featured;
  if (tags !== undefined) portfolio.tags = tags.split(',').map(tag => tag.trim());
  
  // Handle new images if uploaded
  if (req.files && req.files.length > 0) {
    // Delete old images from Cloudinary
    for (const image of portfolio.images) {
      try {
        await cloudinary.uploader.destroy(image.publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }
    
    // Add new images
    portfolio.images = req.files.map(file => ({
      publicId: file.public_id,
      url: file.secure_url,
      width: file.width,
      height: file.height,
      caption: ''
    }));
  }
  
  await portfolio.save();
  
  res.status(200).json({ 
    success: true,
    message: 'Portfolio item updated successfully',
    portfolio 
  });
});

// Delete portfolio item (admin only)
export const deletePortfolioItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const portfolio = await Portfolio.findById(id);
  
  if (!portfolio) {
    return res.status(404).json({ 
      success: false,
      message: 'Portfolio item not found' 
    });
  }
  
  // Delete images from Cloudinary
  for (const image of portfolio.images) {
    try {
      await cloudinary.uploader.destroy(image.publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  }
  
  await Portfolio.findByIdAndDelete(id);
  
  res.status(200).json({ 
    success: true,
    message: 'Portfolio item deleted successfully' 
  });
});

// Get portfolio categories (public)
export const getPortfolioCategories = asyncHandler(async (req, res) => {
  // Get unique categories from published portfolio items
  const categories = await Portfolio.distinct('category', { isPublished: true });
  
  // Count items in each category
  const categoryCounts = await Portfolio.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  res.status(200).json({
    success: true,
    categories: categoryCounts
  });
});