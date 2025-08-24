import Booking from '../models/Booking.js';
import Availability from '../models/Availability.js';
import nodemailer from 'nodemailer';
import moment from 'moment';
import { getEmailTemplate } from '../utils/emailTemplates.js';
import asyncHandler from 'express-async-handler';

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function to send emails asynchronously
const sendEmails = async (mailOptions) => {
  try {
    await Promise.all(mailOptions.map(option => transporter.sendMail(option)));
  } catch (error) {
    console.error('Email sending failed:', error);
    // We don't throw here to avoid failing the main operation
  }
};

// Create a new booking (public)
export const createBooking = asyncHandler(async (req, res) => {
  const session = await Booking.startSession();
  session.startTransaction();
  
  try {
    const { client, event, pricing, notes } = req.body;
    
    // Validate required fields
    if (!client?.fullName || !client?.email || !client?.phone || 
        !event?.type || !event?.date || !event?.startTime || !event?.endTime || 
        !event?.location || !pricing?.estimate || !pricing?.depositRequired) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'All required fields must be provided' 
      });
    }
    
    // Check if event date is in the future
    if (moment(event.date).isBefore(moment().startOf('day'))) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Event date must be in the future' 
      });
    }
    
    // Check availability
    const eventDate = moment(event.date).startOf('day').toDate();
    let availability = await Availability.findOne({ date: eventDate }).session(session);
    
    if (!availability) {
      availability = new Availability({
        date: eventDate,
        isAvailable: true,
        slots: []
      });
    }
    
    if (!availability.isAvailable) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Selected date is unavailable' 
      });
    }
    
    // Check for overlapping bookings
    const existingBooking = await Booking.findOne({
      'event.date': eventDate,
      'status': { $ne: 'cancelled' },
      $or: [
        {
          $and: [
            { 'event.startTime': { $lte: event.startTime } },
            { 'event.endTime': { $gt: event.startTime } }
          ]
        },
        {
          $and: [
            { 'event.startTime': { $lt: event.endTime } },
            { 'event.endTime': { $gte: event.endTime } }
          ]
        },
        {
          $and: [
            { 'event.startTime': { $gte: event.startTime } },
            { 'event.endTime': { $lte: event.endTime } }
          ]
        }
      ]
    }).session(session);
    
    if (existingBooking) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Time slot conflicts with existing booking' 
      });
    }
    
    // Create booking
    const booking = new Booking({
      client,
      event: {
        ...event,
        date: eventDate
      },
      pricing,
      notes,
    });
    
    // Save booking
    await booking.save({ session });
    
    // Update availability - mark the time slot as booked
    const slotExists = availability.slots.some(
      slot => slot.start === event.startTime && slot.end === event.endTime
    );
    
    if (!slotExists) {
      availability.slots.push({
        start: event.startTime,
        end: event.endTime,
        status: 'booked'
      });
    } else {
      const slotIndex = availability.slots.findIndex(
        slot => slot.start === event.startTime && slot.end === event.endTime
      );
      availability.slots[slotIndex].status = 'booked';
    }
    
    await availability.save({ session });
    
    // Prepare email data
    const emailData = {
      clientName: client.fullName,
      clientEmail: client.email,
      clientPhone: client.phone,
      eventType: event.type,
      eventDate: moment(event.date).format('MMMM D, YYYY'),
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      estimate: pricing.estimate,
      overnightSurcharge: booking.pricing.overnightSurcharge,
      depositRequired: pricing.depositRequired,
      currency: pricing.currency,
      isOvernight: booking.isOvernight,
      supportEmail: process.env.EMAIL_USER,
      whatsappUrl: `https://wa.me/${process.env.WHATSAPP_NUMBER || '2348012345678'}`,
      baseUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
    };
    
    // Prepare email options
    const clientMailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: client.email,
      subject: 'Party Pallet Booking Confirmation',
      html: getEmailTemplate('clientConfirmation', emailData)
    };
    
    const adminMailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'New Booking Received - Party Pallet',
      html: getEmailTemplate('adminNotification', emailData)
    };
    
    // Send emails asynchronously
    sendEmails([clientMailOptions, adminMailOptions]);
    
    // Commit transaction
    await session.commitTransaction();
    
    res.status(201).json({ 
      success: true,
      message: 'Booking created successfully', 
      booking: {
        ...booking.toObject(),
        event: {
          ...booking.event,
          date: moment(booking.event.date).format('YYYY-MM-DD')
        }
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating booking:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  } finally {
    session.endSession();
  }
});

// Get all bookings (admin only)
export const getAllBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status;
  
  // Build query
  let query = {};
  if (status) {
    query.status = status;
  }
  
  const bookings = await Booking.find(query)
    .populate('payment')
    .sort({ 'event.date': 1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Booking.countDocuments(query);
  
  res.status(200).json({
    success: true,
    bookings,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    }
  });
});

// Update booking status (admin only)
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const session = await Booking.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    
    if (!['pending', 'deposit-paid', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status' 
      });
    }
    
    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }
    
    // If cancelling, free up the availability slot
    if (status === 'cancelled' && booking.status !== 'cancelled') {
      const availability = await Availability.findOne({
        date: booking.event.date
      }).session(session);
      
      if (availability) {
        const slotIndex = availability.slots.findIndex(
          slot => slot.start === booking.event.startTime && slot.end === booking.event.endTime
        );
        
        if (slotIndex !== -1) {
          availability.slots[slotIndex].status = 'available';
          await availability.save({ session });
        }
      }
    }
    
    // Set metadata for status history
    booking._changedBy = req.user._id;
    booking._statusChangeNote = note || '';
    
    // Update status
    booking.status = status;
    await booking.save({ session });
    
    // Prepare email data
    const emailData = {
      clientName: booking.client.fullName,
      eventType: booking.event.type,
      eventDate: moment(booking.event.date).format('MMMM D, YYYY'),
      startTime: booking.event.startTime,
      status,
      note: note || '',
      supportEmail: process.env.EMAIL_USER,
      whatsappUrl: `https://wa.me/${process.env.WHATSAPP_NUMBER || '2348012345678'}`,
      baseUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
    };
    
    // Send status update email
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: booking.client.email,
      subject: 'Party Pallet Booking Update',
      html: getEmailTemplate('statusUpdate', emailData)
    };
    
    // Send email asynchronously
    sendEmails([mailOptions]);
    
    // Commit transaction
    await session.commitTransaction();
    
    res.status(200).json({ 
      success: true,
      message: 'Booking updated successfully', 
      booking 
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating booking status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  } finally {
    session.endSession();
  }
});

// Get booking by ID
export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('testimonials')
    .populate('payment');
  
  if (!booking) {
    return res.status(404).json({ 
      success: false,
      message: "Booking not found" 
    });
  }
  
  res.status(200).json({
    success: true,
    booking
  });
});

// Get booking payment details
export const getBookingPaymentDetails = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate({
      path: 'payment',
      select: 'reference amount status paymentDate currency'
    });
  
  if (!booking) {
    return res.status(404).json({ 
      success: false,
      message: "Booking not found" 
    });
  }
  
  // Calculate total paid (convert from kobo to Naira)
  const totalPaid = booking.payment.reduce((sum, payment) => {
    return sum + (payment.status === 'success' ? payment.amount / 100 : 0);
  }, 0);
  
  // Calculate remaining balance
  const totalAmount = booking.pricing.estimate + booking.pricing.overnightSurcharge;
  const remainingBalance = totalAmount - totalPaid;
  
  // Format payments for response (convert amount from kobo to Naira)
  const formattedPayments = booking.payment.map(payment => ({
    ...payment.toObject(),
    amount: payment.amount / 100 // Convert to Naira for display
  }));
  
  res.status(200).json({
    success: true,
    bookingId: booking._id,
    client: booking.client,
    event: booking.event,
    status: booking.status,
    paymentStatus: booking.paymentStatus || 'pending',
    totalAmount,
    totalPaid,
    remainingBalance,
    payments: formattedPayments
  });
});

// Update booking details (admin only)
export const updateBooking = asyncHandler(async (req, res) => {
  const session = await Booking.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { client, event, pricing, notes } = req.body;
    
    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }
    
    // Check if event date is changing
    let dateChanged = false;
    if (event && event.date && moment(event.date).format('YYYY-MM-DD') !== moment(booking.event.date).format('YYYY-MM-DD')) {
      dateChanged = true;
      
      // Check if new date is in the future
      if (moment(event.date).isBefore(moment().startOf('day'))) {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false,
          message: 'Event date must be in the future' 
        });
      }
    }
    
    // Check if time is changing
    let timeChanged = false;
    if (event && (event.startTime !== booking.event.startTime || event.endTime !== booking.event.endTime)) {
      timeChanged = true;
    }
    
    // If date or time is changing, check availability
    if (dateChanged || timeChanged) {
      const newDate = dateChanged ? moment(event.date).startOf('day').toDate() : booking.event.date;
      const newStartTime = event?.startTime || booking.event.startTime;
      const newEndTime = event?.endTime || booking.event.endTime;
      
      // Check for overlapping bookings
      const existingBooking = await Booking.findOne({
        'event.date': newDate,
        'status': { $ne: 'cancelled' },
        '_id': { $ne: id }, // Exclude current booking
        $or: [
          {
            $and: [
              { 'event.startTime': { $lte: newStartTime } },
              { 'event.endTime': { $gt: newStartTime } }
            ]
          },
          {
            $and: [
              { 'event.startTime': { $lt: newEndTime } },
              { 'event.endTime': { $gte: newEndTime } }
            ]
          },
          {
            $and: [
              { 'event.startTime': { $gte: newStartTime } },
              { 'event.endTime': { $lte: newEndTime } }
            ]
          }
        ]
      }).session(session);
      
      if (existingBooking) {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false,
          message: 'Time slot conflicts with existing booking' 
        });
      }
      
      // If date changed, update availability
      if (dateChanged) {
        // Free up old slot
        const oldAvailability = await Availability.findOne({
          date: booking.event.date
        }).session(session);
        
        if (oldAvailability) {
          const slotIndex = oldAvailability.slots.findIndex(
            slot => slot.start === booking.event.startTime && slot.end === booking.event.endTime
          );
          
          if (slotIndex !== -1) {
            oldAvailability.slots[slotIndex].status = 'available';
            await oldAvailability.save({ session });
          }
        }
        
        // Book new slot
        let newAvailability = await Availability.findOne({
          date: newDate
        }).session(session);
        
        if (!newAvailability) {
          newAvailability = new Availability({
            date: newDate,
            isAvailable: true,
            slots: []
          });
        }
        
        const newSlotExists = newAvailability.slots.some(
          slot => slot.start === newStartTime && slot.end === newEndTime
        );
        
        if (!newSlotExists) {
          newAvailability.slots.push({
            start: newStartTime,
            end: newEndTime,
            status: 'booked'
          });
        } else {
          const slotIndex = newAvailability.slots.findIndex(
            slot => slot.start === newStartTime && slot.end === newEndTime
          );
          newAvailability.slots[slotIndex].status = 'booked';
        }
        
        await newAvailability.save({ session });
      } else if (timeChanged) {
        // Only time changed, update availability
        const availability = await Availability.findOne({
          date: booking.event.date
        }).session(session);
        
        if (availability) {
          // Free up old slot
          const oldSlotIndex = availability.slots.findIndex(
            slot => slot.start === booking.event.startTime && slot.end === booking.event.endTime
          );
          
          if (oldSlotIndex !== -1) {
            availability.slots[oldSlotIndex].status = 'available';
          }
          
          // Book new slot
          const newSlotExists = availability.slots.some(
            slot => slot.start === newStartTime && slot.end === newEndTime
          );
          
          if (!newSlotExists) {
            availability.slots.push({
              start: newStartTime,
              end: newEndTime,
              status: 'booked'
            });
          } else {
            const slotIndex = availability.slots.findIndex(
              slot => slot.start === newStartTime && slot.end === newEndTime
            );
            availability.slots[slotIndex].status = 'booked';
          }
          
          await availability.save({ session });
        }
      }
    }
    
    // Update booking details
    if (client) {
      if (client.fullName) booking.client.fullName = client.fullName;
      if (client.email) booking.client.email = client.email;
      if (client.phone) booking.client.phone = client.phone;
    }
    
    if (event) {
      if (event.type) booking.event.type = event.type;
      if (event.title) booking.event.title = event.title;
      if (event.date) booking.event.date = moment(event.date).startOf('day').toDate();
      if (event.startTime) booking.event.startTime = event.startTime;
      if (event.endTime) booking.event.endTime = event.endTime;
      if (event.location) booking.event.location = event.location;
      if (event.consultationMode) booking.event.consultationMode = event.consultationMode;
      if (event.notes !== undefined) booking.event.notes = event.notes;
    }
    
    if (pricing) {
      if (pricing.estimate !== undefined) booking.pricing.estimate = pricing.estimate;
      if (pricing.overnightSurcharge !== undefined) booking.pricing.overnightSurcharge = pricing.overnightSurcharge;
      if (pricing.depositRequired !== undefined) booking.pricing.depositRequired = pricing.depositRequired;
      if (pricing.currency) booking.pricing.currency = pricing.currency;
      if (pricing.finalAgreed !== undefined) booking.pricing.finalAgreed = pricing.finalAgreed;
    }
    
    if (notes !== undefined) booking.notes = notes;
    
    // Set metadata for status history
    booking._changedBy = req.user._id;
    booking._statusChangeNote = 'Booking details updated';
    
    await booking.save({ session });
    
    // Commit transaction
    await session.commitTransaction();
    
    res.status(200).json({ 
      success: true,
      message: 'Booking updated successfully', 
      booking: {
        ...booking.toObject(),
        event: {
          ...booking.event,
          date: moment(booking.event.date).format('YYYY-MM-DD')
        }
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating booking:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  } finally {
    session.endSession();
  }
});

// Cancel booking (admin only)
export const cancelBooking = asyncHandler(async (req, res) => {
  const session = await Booking.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Cancellation reason is required' 
      });
    }
    
    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }
    
    if (booking.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Booking is already cancelled' 
      });
    }
    
    // Free up availability slot
    const availability = await Availability.findOne({
      date: booking.event.date
    }).session(session);
    
    if (availability) {
      const slotIndex = availability.slots.findIndex(
        slot => slot.start === booking.event.startTime && slot.end === booking.event.endTime
      );
      
      if (slotIndex !== -1) {
        availability.slots[slotIndex].status = 'available';
        await availability.save({ session });
      }
    }
    
    // Cancel booking
    await booking.cancel(reason, req.user._id);
    
    // Prepare email data
    const emailData = {
      clientName: booking.client.fullName,
      eventType: booking.event.type,
      eventDate: moment(booking.event.date).format('MMMM D, YYYY'),
      startTime: booking.event.startTime,
      reason,
      supportEmail: process.env.EMAIL_USER,
      whatsappUrl: `https://wa.me/${process.env.WHATSAPP_NUMBER || '2348012345678'}`,
      baseUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
    };
    
    // Send cancellation email
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: booking.client.email,
      subject: 'Party Pallet Booking Cancellation',
      html: getEmailTemplate('cancellation', emailData)
    };
    
    // Send email asynchronously
    sendEmails([mailOptions]);
    
    // Commit transaction
    await session.commitTransaction();
    
    res.status(200).json({ 
      success: true,
      message: 'Booking cancelled successfully', 
      booking 
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error cancelling booking:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  } finally {
    session.endSession();
  }
});