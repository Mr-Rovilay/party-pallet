import Paystack from 'paystack-api';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import moment from 'moment';
import { getEmailTemplate } from '../utils/emailTemplates.js';
import asyncHandler from 'express-async-handler';

// Initialize Paystack
const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY);

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

// Initialize payment
export const initializePayment = asyncHandler(async (req, res) => {
  const { bookingId, amount, email } = req.body;
  
  // Validate input
  if (!bookingId || !amount || !email) {
    return res.status(400).json({ 
      success: false,
      message: 'Booking ID, amount, and email are required' 
    });
  }
  
  // Validate email format
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false,
      message: 'Please provide a valid email address' 
    });
  }
  
  // Find booking and populate client details
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ 
      success: false,
      message: 'Booking not found' 
    });
  }
  
  // Check if amount meets minimum deposit
  if (amount < booking.pricing.depositRequired) {
    return res.status(400).json({ 
      success: false,
      message: `Amount is less than required deposit of ${booking.pricing.depositRequired} ${booking.pricing.currency}` 
    });
  }
  
  // Check if there's already a successful payment for this booking
  const existingPayment = await Payment.findOne({
    bookingId,
    status: 'success'
  });
  
  if (existingPayment) {
    return res.status(400).json({ 
      success: false,
      message: 'Payment already completed for this booking' 
    });
  }
  
  // Generate unique reference
  const reference = `party_pallet_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  
  // Create payment record without customer metadata
  const payment = new Payment({
    bookingId,
    provider: 'paystack',
    reference,
    amount: amount * 100, // Convert to kobo
    currency: booking.pricing.currency,
    metadata: {
      ip: req.ip,
      userAgent: req.get('User-Agent')
      // Removed customer field
    }
  });
  
  // Initialize payment with Paystack
  const response = await paystack.transaction.initialize({
    email,
    amount: amount * 100, // Paystack expects amount in kobo
    reference,
    callback_url: process.env.PAYSTACK_CALLBACK_URL,
    metadata: {
      bookingId,
      custom_fields: [
        {
          display_name: "Booking ID",
          variable_name: "booking_id",
          value: bookingId
        }
      ]
    }
  });
  
  // Save payment with raw response
  payment.raw = response.data;
  await payment.save();
  
  const paymentResponse = payment.toObject({ virtuals: true });
  
  res.status(200).json({ 
    success: true,
    authorization_url: response.data.authorization_url,
    reference,
     payment: paymentResponse,
    displayAmount: paymentResponse.formattedAmount
  });
});

// Handle Paystack webhook
export const handleWebhook = asyncHandler(async (req, res) => {
  // Verify webhook signature
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid signature' 
    });
  }
  
  const event = req.body;
  
  // Handle different event types
  if (event.event === 'charge.success') {
    await handleSuccessfulPayment(event.data);
  } else if (event.event === 'charge.failed') {
    await handleFailedPayment(event.data);
  }
  
  res.status(200).json({ 
    success: true,
    message: 'Webhook received' 
  });
});

// Handle successful payment
const handleSuccessfulPayment = async (data) => {
  try {
    const payment = await Payment.findOne({ reference: data.reference })
      .populate('bookingId'); // Populate booking to get client details
    
    if (!payment) {
      console.error('Payment not found for reference:', data.reference);
      return;
    }
    
    // Check if payment is already processed
    if (payment.status === 'success') {
      console.log('Payment already processed:', data.reference);
      return;
    }
    
    // Update payment status
    payment.status = 'success';
    payment.raw = data;
    payment.paymentDate = new Date(data.paid_at);
    payment.channel = data.channel || null;
    await payment.save();
    
    // Get booking details from populated payment
    const booking = payment.bookingId;
    if (booking) {
      // Push payment reference to the payment array
      booking.payment.push(payment._id);
      booking.status = 'deposit-paid';
      await booking.save();
      
      // Prepare email data using populated booking details
      const emailData = {
        clientName: booking.client.fullName,
        clientEmail: booking.client.email,
        eventType: booking.event.type,
        eventDate: moment(booking.event.date).format('MMMM D, YYYY'),
        startTime: booking.event.startTime,
        endTime: booking.event.endTime,
        location: booking.event.location,
        paymentAmount: data.amount / 100, // Convert from kobo to Naira
        paymentReference: data.reference,
        paymentDate: moment(data.paid_at).format('MMMM D, YYYY, h:mm A'),
        currency: data.currency,
        supportEmail: process.env.EMAIL_USER,
        whatsappUrl: `https://wa.me/${process.env.WHATSAPP_NUMBER || '2348012345678'}`,
        baseUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
      };
      
      // Client payment confirmation email
      const clientMailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: booking.client.email,
        subject: 'Payment Confirmation - Party Pallet',
        html: getEmailTemplate('paymentConfirmation', emailData)
      };
      
      // Admin notification email
      const adminMailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'Payment Received - Party Pallet',
        html: getEmailTemplate('adminPaymentNotification', emailData)
      };
      
      // Send emails asynchronously
      sendEmails([clientMailOptions, adminMailOptions]);
    }
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
};

// Handle failed payment
const handleFailedPayment = async (data) => {
  try {
    const payment = await Payment.findOne({ reference: data.reference })
      .populate('bookingId'); // Populate booking to get client details
    
    if (!payment) {
      console.error('Payment not found for reference:', data.reference);
      return;
    }
    
    // Check if payment is already processed
    if (payment.status === 'failed') {
      console.log('Payment already marked as failed:', data.reference);
      return;
    }
    
    // Update payment status
    payment.status = 'failed';
    payment.raw = data;
    payment.failureReason = data.gateway_response || 'Payment failed';
    await payment.save();
    
    // Get booking details from populated payment
    const booking = payment.bookingId;
    if (booking) {
      // Prepare email data using populated booking details
      const emailData = {
        clientName: booking.client.fullName,
        clientEmail: booking.client.email,
        eventType: booking.event.type,
        eventDate: moment(booking.event.date).format('MMMM D, YYYY'),
        paymentReference: data.reference,
        supportEmail: process.env.EMAIL_USER,
        whatsappUrl: `https://wa.me/${process.env.WHATSAPP_NUMBER || '2348012345678'}`,
        baseUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
      };
      
      // Client payment failure notification
      const clientMailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: booking.client.email,
        subject: 'Payment Issue - Party Pallet',
        html: getEmailTemplate('paymentFailure', emailData)
      };
      
      // Admin notification
      const adminMailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'Payment Failed - Party Pallet',
        html: getEmailTemplate('adminPaymentFailure', emailData)
      };
      
      // Send emails asynchronously
      sendEmails([clientMailOptions, adminMailOptions]);
    }
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
};

// Verify payment
export const verifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params;
  
  // Execute the query first
  const payment = await Payment.findOne({ reference })
    .populate('bookingId')
    .exec(); // Execute the query to get a document
  
  if (!payment) {
    return res.status(404).json({ 
      success: false,
      message: 'Payment not found' 
    });
  }
  
  // If payment is still pending, verify with Paystack
  if (payment.status === 'initialized' || payment.status === 'pending') {
    const response = await paystack.transaction.verify({reference});
    
    if (response.data.status === 'success') {
      await handleSuccessfulPayment(response.data);
    } else if (response.data.status === 'failed') {
      await handleFailedPayment(response.data);
    }
    
    // Get updated payment with populated booking
    const updatedPayment = await Payment.findOne({ reference })
      .populate('bookingId')
      .exec(); // Execute the query to get a document
    
    return res.status(200).json({
      success: true,
      payment: updatedPayment.toObject({ virtuals: true })
    });
  }
  
  res.status(200).json({
    success: true,
    payment: payment.toObject({ virtuals: true })
  });
});

// Get payment by booking ID
export const getPaymentByBookingId = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  
  // Execute the query first, then convert to object
  const payment = await Payment.findOne({ bookingId })
    .populate('bookingId') // Populate booking details
    .sort({ createdAt: -1 })
    .exec(); // Execute the query to get a document
  
  if (!payment) {
    return res.status(404).json({ 
      success: false,
      message: 'Payment not found' 
    });
  }
  
  // Now convert the document to an object with virtuals
  const paymentObject = payment.toObject({ virtuals: true });
  
  res.status(200).json({
    success: true,
    payment: paymentObject
  });
});


// Retry payment
export const retryPayment = asyncHandler(async (req, res) => {
  const { bookingId, email } = req.body;
  
  // Validate input
  if (!bookingId || !email) {
    return res.status(400).json({ 
      success: false,
      message: 'Booking ID and email are required' 
    });
  }
  
  // Find booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ 
      success: false,
      message: 'Booking not found' 
    });
  }
  
  // Find the last failed payment for this booking
  const lastPayment = await Payment.findOne({ 
    bookingId, 
    status: 'failed' 
  }).sort({ createdAt: -1 });
  
  if (!lastPayment) {
    return res.status(404).json({ 
      success: false,
      message: 'No failed payment found for this booking' 
    });
  }
  
  // Generate new reference
  const reference = `party_pallet_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  
  // Create new payment record without customer metadata
  const payment = new Payment({
    bookingId,
    provider: 'paystack',
    reference,
    amount: lastPayment.amount,
    currency: lastPayment.currency,
    metadata: {
      ip: req.ip,
      userAgent: req.get('User-Agent')
      // Removed customer field
    }
  });
  
  // Initialize payment with Paystack
  const response = await paystack.transaction.initialize({
    email,
    amount: payment.amount,
    reference,
    callback_url: process.env.PAYSTACK_CALLBACK_URL,
    metadata: {
      bookingId,
      custom_fields: [
        {
          display_name: "Booking ID",
          variable_name: "booking_id",
          value: bookingId
        }
      ]
    }
  });
  
  // Save payment with raw response
  payment.raw = response.data;
  await payment.save();
  
  const paymentResponse = payment.toObject({ virtuals: true });
  
  res.status(200).json({ 
    success: true,
    authorization_url: response.data.authorization_url,
    reference,
    payment: payment.toObject({ virtuals: true }),
    displayAmount: paymentResponse.formattedAmount
  });
});