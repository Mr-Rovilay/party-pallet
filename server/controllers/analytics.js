import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Testimonial from '../models/Testimonial.js';
import moment from 'moment';
import asyncHandler from 'express-async-handler';

// Get analytics (admin only)
export const getAnalytics = asyncHandler(async (req, res) => {
  // Get date range for filtering (default: last 12 months)
  const startDate = moment().subtract(12, 'months').startOf('month').toDate();
  const endDate = moment().endOf('month').toDate();
  
  // Get total bookings count
  const totalBookings = await Booking.countDocuments();
  
  // Get bookings by status
  const bookingsByStatus = await Booking.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  
  // Get bookings by event type
  const bookingsByEventType = await Booking.aggregate([
    { $group: { _id: '$event.type', count: { $sum: 1 } } },
  ]);
  
  // Calculate total revenue (using finalAgreed if available, otherwise estimate + overnightSurcharge)
  const revenuePipeline = [
    { $match: { status: { $in: ['deposit-paid', 'confirmed', 'completed'] } } },
    {
      $project: {
        amount: {
          $cond: {
            if: { $gt: ['$pricing.finalAgreed', 0] },
            then: '$pricing.finalAgreed',
            else: { $add: ['$pricing.estimate', '$pricing.overnightSurcharge'] }
          }
        }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ];
  
  const revenueResult = await Booking.aggregate(revenuePipeline);
  const totalRevenue = revenueResult[0]?.total || 0;
  
  // Get monthly bookings trend (last 12 months)
  const monthlyBookings = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
  
  // Format monthly bookings data
  const formattedMonthlyBookings = monthlyBookings.map(item => ({
    month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
    count: item.count
  }));
  
  // Get monthly revenue trend (last 12 months)
  const monthlyRevenue = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $in: ['deposit-paid', 'confirmed', 'completed'] }
      }
    },
    {
      $project: {
        month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        amount: {
          $cond: {
            if: { $gt: ['$pricing.finalAgreed', 0] },
            then: '$pricing.finalAgreed',
            else: { $add: ['$pricing.estimate', '$pricing.overnightSurcharge'] }
          }
        }
      }
    },
    {
      $group: {
        _id: '$month',
        total: { $sum: '$amount' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
  
  // Get upcoming bookings (next 30 days)
  const today = moment().startOf('day').toDate();
  const thirtyDaysLater = moment().add(30, 'days').endOf('day').toDate();
  
  const upcomingBookings = await Booking.find({
    'event.date': { $gte: today, $lte: thirtyDaysLater },
    status: { $in: ['pending', 'deposit-paid', 'confirmed'] }
  })
  .sort({ 'event.date': 1 })
  .limit(10)
  .select('client.fullName event.type event.date event.startTime event.location status');
  
  // Get recent bookings (last 5)
  const recentBookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('client.fullName event.type event.date status createdAt');
  
  // Get payment statistics
  const paymentStats = await Payment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  // Get testimonials statistics
  const testimonialStats = await Testimonial.aggregate([
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        activeCount: {
          $sum: { $cond: ['$active', 1, 0] }
        }
      }
    }
  ]);
  
  // Get top event types by revenue
  const topEventTypes = await Booking.aggregate([
    {
      $match: { status: { $in: ['deposit-paid', 'confirmed', 'completed'] } }
    },
    {
      $project: {
        eventType: '$event.type',
        amount: {
          $cond: {
            if: { $gt: ['$pricing.finalAgreed', 0] },
            then: '$pricing.finalAgreed',
            else: { $add: ['$pricing.estimate', '$pricing.overnightSurcharge'] }
          }
        }
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        revenue: { $sum: '$amount' }
      }
    },
    {
      $sort: { revenue: -1 }
    },
    {
      $limit: 5
    }
  ]);
  
  // Get booking completion rate
  const completedBookings = await Booking.countDocuments({ status: 'completed' });
  const bookingCompletionRate = totalBookings > 0 
    ? ((completedBookings / totalBookings) * 100).toFixed(2) 
    : 0;
  
  // Get average booking value
  const averageBookingValue = totalBookings > 0 
    ? (totalRevenue / totalBookings).toFixed(2) 
    : 0;
  
  // Get deposit collection rate
  const depositPaidBookings = await Booking.countDocuments({ status: { $in: ['deposit-paid', 'confirmed', 'completed'] } });
  const depositCollectionRate = totalBookings > 0 
    ? ((depositPaidBookings / totalBookings) * 100).toFixed(2) 
    : 0;
  
  // Prepare response
  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalBookings,
        totalRevenue,
        bookingCompletionRate: parseFloat(bookingCompletionRate),
        averageBookingValue: parseFloat(averageBookingValue),
        depositCollectionRate: parseFloat(depositCollectionRate)
      },
      bookings: {
        byStatus: bookingsByStatus,
        byEventType: bookingsByEventType,
        monthlyTrend: formattedMonthlyBookings,
        upcoming: upcomingBookings,
        recent: recentBookings
      },
      revenue: {
        monthlyTrend: monthlyRevenue,
        topEventTypes: topEventTypes
      },
      payments: {
        statistics: paymentStats
      },
      testimonials: {
        statistics: testimonialStats[0] || {
          count: 0,
          averageRating: 0,
          activeCount: 0
        }
      }
    }
  });
});

// Get detailed monthly report (admin only)
export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  
  if (!year || !month) {
    return res.status(400).json({
      success: false,
      message: 'Year and month are required'
    });
  }
  
  // Create date range for the specified month
  const startDate = moment(`${year}-${month}`, 'YYYY-MM')
    .startOf('month')
    .toDate();
  const endDate = moment(`${year}-${month}`, 'YYYY-MM')
    .endOf('month')
    .toDate();
  
  // Get bookings for the month
  const bookings = await Booking.find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('payment');
  
  // Calculate metrics
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const canceledBookings = bookings.filter(b => b.status === 'cancelled').length;
  
  // Calculate revenue
  const revenue = bookings
    .filter(b => ['deposit-paid', 'confirmed', 'completed'].includes(b.status))
    .reduce((total, booking) => {
      const amount = booking.pricing.finalAgreed > 0 
        ? booking.pricing.finalAgreed 
        : booking.pricing.estimate + booking.pricing.overnightSurcharge;
      return total + amount;
    }, 0);
  
  // Calculate collected deposits
  const collectedDeposits = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((total, booking) => {
      return total + booking.pricing.depositRequired;
    }, 0);
  
  // Get payments for the month
  const payments = await Payment.find({
    paymentDate: { $gte: startDate, $lte: endDate },
    status: 'success'
  });
  
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0) / 100; // Convert from kobo
  
  // Get testimonials for the month
  const testimonials = await Testimonial.find({
    createdAt: { $gte: startDate, $lte: endDate }
  });
  
  const averageRating = testimonials.length > 0
    ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
    : 0;
  
  // Group bookings by event type
  const bookingsByEventType = {};
  bookings.forEach(booking => {
    const type = booking.event.type;
    if (!bookingsByEventType[type]) {
      bookingsByEventType[type] = 0;
    }
    bookingsByEventType[type]++;
  });
  
  // Group bookings by status
  const bookingsByStatus = {};
  bookings.forEach(booking => {
    const status = booking.status;
    if (!bookingsByStatus[status]) {
      bookingsByStatus[status] = 0;
    }
    bookingsByStatus[status]++;
  });
  
  res.status(200).json({
    success: true,
    data: {
      period: {
        year: parseInt(year),
        month: parseInt(month),
        startDate,
        endDate
      },
      summary: {
        totalBookings,
        completedBookings,
        canceledBookings,
        revenue,
        collectedDeposits,
        totalPayments,
        averageRating
      },
      bookings: {
        byEventType: bookingsByEventType,
        byStatus: bookingsByStatus
      },
      testimonials: {
        count: testimonials.length,
        averageRating
      }
    }
  });
});