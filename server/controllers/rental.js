import Rental from '../models/Rental.js';
import cloudinary from 'cloudinary';

// Create rental item (admin only)
export const createRental = async (req, res) => {
  try {
    const { name, description, basePrice, tags, active } = req.body;

    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.v2.uploader.upload(file.path, {
          folder: "rentals",
        });
        images.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }

    if (!name || !images.length) {
      return res.status(400).json({ message: 'Name and at least one image are required' });
    }

    const rental = new Rental({
      name,
      description,
      images,
      basePrice: basePrice ?? 0,
      tags: tags ? tags.split(',') : [],
      active: active ?? true,
    });

    await rental.save();
    res.status(201).json({ message: 'Rental created', rental });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all rentals (public)
export const getRentals = async (req, res) => {
  try {
    const { tags } = req.query;
    const query = { active: true };
    if (tags) query.tags = { $in: tags.split(',') };

    const rentals = await Rental.find(query).select("-__v -createdAt -updatedAt");
    res.status(200).json(rentals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update rental (admin only)
export const updateRental = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, basePrice, tags, active } = req.body;

    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    let newImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.v2.uploader.upload(file.path, {
          folder: "rentals",
        });
        newImages.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
      rental.images = newImages; // replace old images
    }

    rental.name = name ?? rental.name;
    rental.description = description ?? rental.description;
    rental.basePrice = basePrice ?? rental.basePrice;
    rental.tags = tags ? tags.split(',') : rental.tags;
    rental.active = active ?? rental.active;

    await rental.save();
    res.status(200).json({ message: 'Rental updated', rental });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete rental (admin only)
export const deleteRental = async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    // delete images from cloudinary too
    for (const img of rental.images) {
      await cloudinary.v2.uploader.destroy(img.public_id);
    }

    await rental.deleteOne();
    res.status(200).json({ message: 'Rental deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
