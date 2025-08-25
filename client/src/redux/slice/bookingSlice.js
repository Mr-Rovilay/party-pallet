import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toast } from 'sonner'
import api from '../../../utils/server'

// Async thunks for booking operations
export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/bookings', bookingData)
      toast.success('Booking created successfully')
      return response.data.booking
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create booking'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getBookings = createAsyncThunk(
  'bookings/getBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/bookings', { withCredentials: true })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch bookings'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getBookingById = createAsyncThunk(
  'bookings/getBookingById',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/bookings/${bookingId}`)
      return response.data.booking
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch booking details'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getBookingPaymentDetails = createAsyncThunk(
  'bookings/getBookingPaymentDetails',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/bookings/${bookingId}/payment-details`)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch payment details'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const updateBookingStatus = createAsyncThunk(
  'bookings/updateBookingStatus',
  async ({ bookingId, status, note }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/bookings/${bookingId}/status`, { status, note })
      toast.success(`Booking status updated to ${status}`)
      return response.data.booking
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update booking status'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const updateBooking = createAsyncThunk(
  'bookings/updateBooking',
  async ({ bookingId, bookingData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/bookings/${bookingId}`, bookingData)
      toast.success('Booking updated successfully')
      return response.data.booking
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update booking'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/bookings/${bookingId}/cancel`, { reason })
      toast.success('Booking cancelled successfully')
      return response.data.booking
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel booking'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

// Initial state
const initialState = {
  bookings: [],
  currentBooking: null,
  bookingPaymentDetails: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  pagination: {
    total: 0,
    page: 1,
    pages: 1,
    limit: 10
  }
}

// Create slice
const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    // Clear current booking
    clearCurrentBooking: (state) => {
      state.currentBooking = null
    },
    
    // Clear booking payment details
    clearBookingPaymentDetails: (state) => {
      state.bookingPaymentDetails = null
    },
    
    // Reset booking state
    resetBookingState: (state) => {
      state.bookings = []
      state.currentBooking = null
      state.bookingPaymentDetails = null
      state.status = 'idle'
      state.error = null
      state.pagination = initialState.pagination
    },
    
    // Add a new booking to the list (for optimistic updates)
    addBookingToList: (state, action) => {
      state.bookings.unshift(action.payload)
    },
    
    // Update a booking in the list
    updateBookingInList: (state, action) => {
      const index = state.bookings.findIndex(booking => booking._id === action.payload._id)
      if (index !== -1) {
        state.bookings[index] = action.payload
      }
    },
    
    // Remove a booking from the list
    removeBookingFromList: (state, action) => {
      state.bookings = state.bookings.filter(booking => booking._id !== action.payload)
    }
  },
  extraReducers: (builder) => {
    // Create booking
    builder
      .addCase(createBooking.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.currentBooking = action.payload
        // Add to the beginning of the list
        state.bookings.unshift(action.payload)
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Get all bookings
    builder
      .addCase(getBookings.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getBookings.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.bookings = action.payload.bookings
        state.pagination = action.payload.pagination
      })
      .addCase(getBookings.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Get booking by ID
    builder
      .addCase(getBookingById.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getBookingById.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.currentBooking = action.payload
      })
      .addCase(getBookingById.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Get booking payment details
    builder
      .addCase(getBookingPaymentDetails.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getBookingPaymentDetails.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.bookingPaymentDetails = action.payload
      })
      .addCase(getBookingPaymentDetails.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Update booking status
    builder
      .addCase(updateBookingStatus.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Update in the list
        const index = state.bookings.findIndex(booking => booking._id === action.payload._id)
        if (index !== -1) {
          state.bookings[index] = action.payload
        }
        // Update current booking if it's the same
        if (state.currentBooking && state.currentBooking._id === action.payload._id) {
          state.currentBooking = action.payload
        }
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Update booking
    builder
      .addCase(updateBooking.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(updateBooking.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Update in the list
        const index = state.bookings.findIndex(booking => booking._id === action.payload._id)
        if (index !== -1) {
          state.bookings[index] = action.payload
        }
        // Update current booking if it's the same
        if (state.currentBooking && state.currentBooking._id === action.payload._id) {
          state.currentBooking = action.payload
        }
      })
      .addCase(updateBooking.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Cancel booking
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Update in the list
        const index = state.bookings.findIndex(booking => booking._id === action.payload._id)
        if (index !== -1) {
          state.bookings[index] = action.payload
        }
        // Update current booking if it's the same
        if (state.currentBooking && state.currentBooking._id === action.payload._id) {
          state.currentBooking = action.payload
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  }
})

// Export actions
export const {
  clearCurrentBooking,
  clearBookingPaymentDetails,
  resetBookingState,
  addBookingToList,
  updateBookingInList,
  removeBookingFromList
} = bookingSlice.actions

// Export reducer
export default bookingSlice.reducer

// Export selectors
export const selectAllBookings = (state) => state.bookings.bookings
export const selectCurrentBooking = (state) => state.bookings.currentBooking
export const selectBookingPaymentDetails = (state) => state.bookings.bookingPaymentDetails
export const selectBookingStatus = (state) => state.bookings.status
export const selectBookingError = (state) => state.bookings.error
export const selectBookingPagination = (state) => state.bookings.pagination