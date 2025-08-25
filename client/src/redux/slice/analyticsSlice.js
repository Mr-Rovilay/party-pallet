import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toast } from 'sonner'
import api from '../../../utils/server'

// Async thunks for analytics operations
export const getAnalytics = createAsyncThunk(
  'analytics/getAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/analytics')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch analytics data'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getMonthlyReport = createAsyncThunk(
  'analytics/getMonthlyReport',
  async (queryParams, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/analytics/monthly', { params: queryParams })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch monthly report'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getBookingTrends = createAsyncThunk(
  'analytics/getBookingTrends',
  async (timeRange, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/analytics/bookings/trends', { params: timeRange })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch booking trends'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getRevenueTrends = createAsyncThunk(
  'analytics/getRevenueTrends',
  async (timeRange, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/analytics/revenue/trends', { params: timeRange })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch revenue trends'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getTopServices = createAsyncThunk(
  'analytics/getTopServices',
  async (timeRange, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/analytics/top-services', { params: timeRange })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch top services'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getRecentBookings = createAsyncThunk(
  'analytics/getRecentBookings',
  async (limit, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/analytics/recent-bookings', { params: { limit } })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch recent bookings'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getUpcomingBookings = createAsyncThunk(
  'analytics/getUpcomingBookings',
  async (limit, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/analytics/upcoming-bookings', { params: { limit } })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch upcoming bookings'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

// Initial state
const initialState = {
  analytics: {
    summary: {
      totalBookings: 0,
      totalRevenue: 0,
      bookingCompletionRate: 0,
      averageBookingValue: 0,
      depositCollectionRate: 0
    },
    bookings: {
      byStatus: [],
      byEventType: [],
      monthlyTrend: [],
      upcoming: [],
      recent: []
    },
    revenue: {
      monthlyTrend: [],
      topEventTypes: []
    },
    payments: {
      statistics: []
    },
    testimonials: {
      statistics: {
        count: 0,
        averageRating: 0,
        activeCount: 0
      }
    }
  },
  monthlyReport: null,
  bookingTrends: [],
  revenueTrends: [],
  topServices: [],
  recentBookings: [],
  upcomingBookings: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  filters: {
    dateRange: {
      start: null,
      end: null
    },
    period: 'monthly' // 'daily' | 'weekly' | 'monthly' | 'yearly'
  }
}

// Create slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    // Set analytics data
    setAnalytics: (state, action) => {
      state.analytics = action.payload
    },
    
    // Set monthly report
    setMonthlyReport: (state, action) => {
      state.monthlyReport = action.payload
    },
    
    // Set booking trends
    setBookingTrends: (state, action) => {
      state.bookingTrends = action.payload
    },
    
    // Set revenue trends
    setRevenueTrends: (state, action) => {
      state.revenueTrends = action.payload
    },
    
    // Set top services
    setTopServices: (state, action) => {
      state.topServices = action.payload
    },
    
    // Set recent bookings
    setRecentBookings: (state, action) => {
      state.recentBookings = action.payload
    },
    
    // Set upcoming bookings
    setUpcomingBookings: (state, action) => {
      state.upcomingBookings = action.payload
    },
    
    // Reset analytics state
    resetAnalyticsState: (state) => {
      state.analytics = initialState.analytics
      state.monthlyReport = null
      state.bookingTrends = []
      state.revenueTrends = []
      state.topServices = []
      state.recentBookings = []
      state.upcomingBookings = []
      state.status = 'idle'
      state.error = null
      state.filters = initialState.filters
    },
    
    // Set filters
    setAnalyticsFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    // Clear filters
    clearAnalyticsFilters: (state) => {
      state.filters = initialState.filters
    },
    
    // Update analytics summary (for real-time updates)
    updateAnalyticsSummary: (state, action) => {
      state.analytics.summary = {
        ...state.analytics.summary,
        ...action.payload
      }
    },
    
    // Add booking to recent bookings
    addRecentBooking: (state, action) => {
      state.recentBookings = [action.payload, ...state.recentBookings].slice(0, 5) // Keep only 5 most recent
    },
    
    // Add booking to upcoming bookings
    addUpcomingBooking: (state, action) => {
      state.upcomingBookings = [action.payload, ...state.upcomingBookings].slice(0, 5) // Keep only 5 upcoming
    },
    
    // Update booking status in analytics
    updateBookingStatusInAnalytics: (state, action) => {
      const { bookingId, status } = action.payload
      
      // Update in bookings by status
      const statusIndex = state.analytics.bookings.byStatus.findIndex(item => item._id === status)
      if (statusIndex !== -1) {
        state.analytics.bookings.byStatus[statusIndex].count += 1
      }
      
      // Update in monthly trends if applicable
      // This would require more complex logic to find the right month
    },
    
    // Update revenue in analytics
    updateRevenueInAnalytics: (state, action) => {
      const { amount, bookingId } = action.payload
      
      // Update total revenue
      state.analytics.summary.totalRevenue += amount
      
      // Update monthly trends if applicable
      // This would require more complex logic to find the right month
      
      // Update top event types if applicable
      // This would require more complex logic to find the right event type
    }
  },
  extraReducers: (builder) => {
    // Get analytics
    builder
      .addCase(getAnalytics.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getAnalytics.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.analytics = action.payload.data
      })
      .addCase(getAnalytics.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        toast.error(action.payload?.message || 'Failed to fetch analytics data')
      })
    
    // Get monthly report
    builder
      .addCase(getMonthlyReport.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getMonthlyReport.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.monthlyReport = action.payload.data
      })
      .addCase(getMonthlyReport.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        toast.error(action.payload?.message || 'Failed to fetch monthly report')
      })
    
    // Get booking trends
    builder
      .addCase(getBookingTrends.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getBookingTrends.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.bookingTrends = action.payload
      })
      .addCase(getBookingTrends.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        toast.error(action.payload?.message || 'Failed to fetch booking trends')
      })
    
    // Get revenue trends
    builder
      .addCase(getRevenueTrends.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getRevenueTrends.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.revenueTrends = action.payload
      })
      .addCase(getRevenueTrends.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        toast.error(action.payload?.message || 'Failed to fetch revenue trends')
      })
    
    // Get top services
    builder
      .addCase(getTopServices.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getTopServices.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.topServices = action.payload
      })
      .addCase(getTopServices.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        toast.error(action.payload?.message || 'Failed to fetch top services')
      })
    
    // Get recent bookings
    builder
      .addCase(getRecentBookings.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getRecentBookings.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.recentBookings = action.payload
      })
      .addCase(getRecentBookings.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        toast.error(action.payload?.message || 'Failed to fetch recent bookings')
      })
    
    // Get upcoming bookings
    builder
      .addCase(getUpcomingBookings.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getUpcomingBookings.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.upcomingBookings = action.payload
      })
      .addCase(getUpcomingBookings.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        toast.error(action.payload?.message || 'Failed to fetch upcoming bookings')
      })
  }
})

// Export actions
export const {
  setAnalytics,
  setMonthlyReport,
  setBookingTrends,
  setRevenueTrends,
  setTopServices,
  setRecentBookings,
  setUpcomingBookings,
  resetAnalyticsState,
  setAnalyticsFilters,
  clearAnalyticsFilters,
  updateAnalyticsSummary,
  addRecentBooking,
  addUpcomingBooking,
  updateBookingStatusInAnalytics,
  updateRevenueInAnalytics
} = analyticsSlice.actions

// Export reducer
export default analyticsSlice.reducer

// Export selectors
export const selectAnalytics = (state) => state.analytics.analytics
export const selectMonthlyReport = (state) => state.analytics.monthlyReport
export const selectBookingTrends = (state) => state.analytics.bookingTrends
export const selectRevenueTrends = (state) => state.analytics.revenueTrends
export const selectTopServices = (state) => state.analytics.topServices
export const selectRecentBookings = (state) => state.analytics.recentBookings
export const selectUpcomingBookings = (state) => state.analytics.upcomingBookings
export const selectAnalyticsStatus = (state) => state.analytics.status
export const selectAnalyticsError = (state) => state.analytics.error
export const selectAnalyticsFilters = (state) => state.analytics.filters

// Helper selectors for dashboard metrics
export const selectTotalBookings = (state) => state.analytics.analytics.summary.totalBookings
export const selectTotalRevenue = (state) => state.analytics.analytics.summary.totalRevenue
export const selectBookingCompletionRate = (state) => state.analytics.analytics.summary.bookingCompletionRate
export const selectAverageBookingValue = (state) => state.analytics.analytics.summary.averageBookingValue
export const selectDepositCollectionRate = (state) => state.analytics.analytics.summary.depositCollectionRate

// Helper selectors for charts
export const selectBookingsByStatus = (state) => state.analytics.analytics.bookings.byStatus
export const selectBookingsByEventType = (state) => state.analytics.analytics.bookings.byEventType
export const selectMonthlyBookingTrend = (state) => state.analytics.analytics.bookings.monthlyTrend
export const selectMonthlyRevenueTrend = (state) => state.analytics.analytics.revenue.monthlyTrend
export const selectTopEventTypes = (state) => state.analytics.analytics.revenue.topEventTypes

// Helper selectors for payment statistics
export const selectPaymentStatistics = (state) => state.analytics.analytics.payments.statistics

// Helper selectors for testimonial statistics
export const selectTestimonialStatistics = (state) => state.analytics.analytics.testimonials.statistics

// Helper function to format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0
  }).format(amount)
}

// Helper function to format percentage
export const formatPercentage = (value) => {
  return `${Number(value).toFixed(1)}%`
}