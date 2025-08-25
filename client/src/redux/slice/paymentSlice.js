/* eslint-disable no-unused-vars */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toast } from 'sonner'
import api from '../../utils/server'

// Async thunks for payment operations
export const initializePayment = createAsyncThunk(
  'payments/initializePayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/payments/initialize', paymentData)
      toast.success('Payment initialized successfully')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to initialize payment'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const verifyPayment = createAsyncThunk(
  'payments/verifyPayment',
  async (reference, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/payments/verify/${reference}`)
      return response.data.payment
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to verify payment'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getPaymentByBookingId = createAsyncThunk(
  'payments/getPaymentByBookingId',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/payments/booking/${bookingId}`)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch payment details'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const retryPayment = createAsyncThunk(
  'payments/retryPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/payments/retry', paymentData)
      toast.success('Payment retry initialized successfully')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to retry payment'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const processWebhook = createAsyncThunk(
  'payments/processWebhook',
  async (webhookData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/payments/webhook', webhookData)
      // Don't show toast for webhooks as they're background processes
      return response.data
    } catch (error) {
      console.error('Webhook processing error:', error)
      return rejectWithValue(error.response?.data || { message: 'Failed to process webhook' })
    }
  }
)

// Initial state
const initialState = {
  payments: [],
  currentPayment: null,
  paymentDetails: null,
  paymentUrl: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  filters: {
    status: null,
    dateRange: {
      start: null,
      end: null
    }
  },
  sort: {
    field: 'createdAt',
    order: 'desc' // 'asc' | 'desc'
  }
}

// Create slice
const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    // Set current payment
    setCurrentPayment: (state, action) => {
      state.currentPayment = action.payload
    },
    
    // Clear current payment
    clearCurrentPayment: (state) => {
      state.currentPayment = null
    },
    
    // Set payment details
    setPaymentDetails: (state, action) => {
      state.paymentDetails = action.payload
    },
    
    // Clear payment details
    clearPaymentDetails: (state) => {
      state.paymentDetails = null
    },
    
    // Set payment URL (for redirect)
    setPaymentUrl: (state, action) => {
      state.paymentUrl = action.payload
    },
    
    // Clear payment URL
    clearPaymentUrl: (state) => {
      state.paymentUrl = null
    },
    
    // Reset payment state
    resetPaymentState: (state) => {
      state.payments = []
      state.currentPayment = null
      state.paymentDetails = null
      state.paymentUrl = null
      state.status = 'idle'
      state.error = null
      state.filters = initialState.filters
      state.sort = initialState.sort
    },
    
    // Set filters
    setPaymentFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    // Clear filters
    clearPaymentFilters: (state) => {
      state.filters = initialState.filters
    },
    
    // Set sort options
    setPaymentSort: (state, action) => {
      state.sort = { ...state.sort, ...action.payload }
    },
    
    // Add payment to the list
    addPaymentToList: (state, action) => {
      state.payments.unshift(action.payload)
    },
    
    // Update payment in the list
    updatePaymentInList: (state, action) => {
      const index = state.payments.findIndex(payment => payment._id === action.payload._id)
      if (index !== -1) {
        state.payments[index] = action.payload
      }
      
      // Update current payment if it's the same
      if (state.currentPayment && state.currentPayment._id === action.payload._id) {
        state.currentPayment = action.payload
      }
      
      // Update payment details if it's the same
      if (state.paymentDetails && state.paymentDetails.bookingId === action.payload.bookingId) {
        state.paymentDetails = action.payload
      }
    },
    
    // Remove payment from the list
    removePaymentFromList: (state, action) => {
      state.payments = state.payments.filter(payment => payment._id !== action.payload)
      
      // Clear current payment if it's the one being removed
      if (state.currentPayment && state.currentPayment._id === action.payload) {
        state.currentPayment = null
      }
    },
    
    // Handle payment initialization success
    handlePaymentInitSuccess: (state, action) => {
      state.paymentUrl = action.payload.authorization_url
      state.currentPayment = {
        ...action.payload.payment,
        status: 'initialized'
      }
    },
    
    // Handle payment verification success
    handlePaymentVerifySuccess: (state, action) => {
      const payment = action.payload
      
      // Update current payment
      if (state.currentPayment && state.currentPayment._id === payment._id) {
        state.currentPayment = payment
      }
      
      // Update in payments list
      const index = state.payments.findIndex(p => p._id === payment._id)
      if (index !== -1) {
        state.payments[index] = payment
      } else {
        state.payments.unshift(payment)
      }
      
      // Update payment details if it's for the same booking
      if (state.paymentDetails && state.paymentDetails.bookingId === payment.bookingId) {
        state.paymentDetails = payment
      }
      
      // Show success message
      if (payment.status === 'success') {
        toast.success('Payment verified successfully')
      } else if (payment.status === 'failed') {
        toast.error('Payment verification failed')
      }
    },
    
    // Handle payment retry success
    handlePaymentRetrySuccess: (state, action) => {
      state.paymentUrl = action.payload.authorization_url
      state.currentPayment = {
        ...action.payload.payment,
        status: 'initialized'
      }
    },
    
    // Handle webhook event
    handleWebhookEvent: (state, action) => {
      const { event, data } = action.payload
      
      if (event === 'charge.success') {
        // Find and update the payment
        const index = state.payments.findIndex(p => p.reference === data.reference)
        if (index !== -1) {
          state.payments[index] = {
            ...state.payments[index],
            status: 'success',
            paymentDate: data.paid_at,
            channel: data.channel,
            raw: data
          }
        }
        
        // Update current payment if it's the same
        if (state.currentPayment && state.currentPayment.reference === data.reference) {
          state.currentPayment = {
            ...state.currentPayment,
            status: 'success',
            paymentDate: data.paid_at,
            channel: data.channel,
            raw: data
          }
        }
        
        // Update payment details if it's for the same booking
        if (state.paymentDetails && state.paymentDetails.bookingId === data.metadata.bookingId) {
          state.paymentDetails = {
            ...state.paymentDetails,
            status: 'success',
            totalPaid: (state.paymentDetails.totalPaid || 0) + (data.amount / 100),
            payments: [
              ...(state.paymentDetails.payments || []),
              {
                reference: data.reference,
                amount: data.amount / 100,
                status: 'success',
                paymentDate: data.paid_at
              }
            ]
          }
        }
      } else if (event === 'charge.failed') {
        // Find and update the payment
        const index = state.payments.findIndex(p => p.reference === data.reference)
        if (index !== -1) {
          state.payments[index] = {
            ...state.payments[index],
            status: 'failed',
            failureReason: data.gateway_response,
            raw: data
          }
        }
        
        // Update current payment if it's the same
        if (state.currentPayment && state.currentPayment.reference === data.reference) {
          state.currentPayment = {
            ...state.currentPayment,
            status: 'failed',
            failureReason: data.gateway_response,
            raw: data
          }
        }
      }
    }
  },
  extraReducers: (builder) => {
    // Initialize payment
    builder
      .addCase(initializePayment.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(initializePayment.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.paymentUrl = action.payload.authorization_url
        state.currentPayment = {
          ...action.payload.payment,
          status: 'initialized'
        }
      })
      .addCase(initializePayment.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        toast.error(action.payload?.message || 'Failed to initialize payment')
      })
    
    // Verify payment
    builder
      .addCase(verifyPayment.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const payment = action.payload
        
        // Update current payment
        if (state.currentPayment && state.currentPayment._id === payment._id) {
          state.currentPayment = payment
        }
        
        // Update in payments list
        const index = state.payments.findIndex(p => p._id === payment._id)
        if (index !== -1) {
          state.payments[index] = payment
        } else {
          state.payments.unshift(payment)
        }
        
        // Update payment details if it's for the same booking
        if (state.paymentDetails && state.paymentDetails.bookingId === payment.bookingId) {
          state.paymentDetails = payment
        }
        
        // Show success message
        if (payment.status === 'success') {
          toast.success('Payment verified successfully')
        } else if (payment.status === 'failed') {
          toast.error('Payment verification failed')
        }
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        toast.error(action.payload?.message || 'Failed to verify payment')
      })
    
    // Get payment by booking ID
    builder
      .addCase(getPaymentByBookingId.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getPaymentByBookingId.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.paymentDetails = action.payload
      })
      .addCase(getPaymentByBookingId.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        toast.error(action.payload?.message || 'Failed to fetch payment details')
      })
    
    // Retry payment
    builder
      .addCase(retryPayment.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(retryPayment.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.paymentUrl = action.payload.authorization_url
        state.currentPayment = {
          ...action.payload.payment,
          status: 'initialized'
        }
      })
      .addCase(retryPayment.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        toast.error(action.payload?.message || 'Failed to retry payment')
      })
    
    // Process webhook
    builder
      .addCase(processWebhook.pending, (state) => {
        // Don't change status for webhooks as they're background processes
      })
      .addCase(processWebhook.fulfilled, (state, action) => {
        // Handle webhook events
        const { event, data } = action.payload
        
        if (event === 'charge.success') {
          // Find and update the payment
          const index = state.payments.findIndex(p => p.reference === data.reference)
          if (index !== -1) {
            state.payments[index] = {
              ...state.payments[index],
              status: 'success',
              paymentDate: data.paid_at,
              channel: data.channel,
              raw: data
            }
          }
          
          // Update current payment if it's the same
          if (state.currentPayment && state.currentPayment.reference === data.reference) {
            state.currentPayment = {
              ...state.currentPayment,
              status: 'success',
              paymentDate: data.paid_at,
              channel: data.channel,
              raw: data
            }
          }
          
          // Update payment details if it's for the same booking
          if (state.paymentDetails && state.paymentDetails.bookingId === data.metadata.bookingId) {
            state.paymentDetails = {
              ...state.paymentDetails,
              status: 'success',
              totalPaid: (state.paymentDetails.totalPaid || 0) + (data.amount / 100),
              payments: [
                ...(state.paymentDetails.payments || []),
                {
                  reference: data.reference,
                  amount: data.amount / 100,
                  status: 'success',
                  paymentDate: data.paid_at
                }
              ]
            }
          }
        } else if (event === 'charge.failed') {
          // Find and update the payment
          const index = state.payments.findIndex(p => p.reference === data.reference)
          if (index !== -1) {
            state.payments[index] = {
              ...state.payments[index],
              status: 'failed',
              failureReason: data.gateway_response,
              raw: data
            }
          }
          
          // Update current payment if it's the same
          if (state.currentPayment && state.currentPayment.reference === data.reference) {
            state.currentPayment = {
              ...state.currentPayment,
              status: 'failed',
              failureReason: data.gateway_response,
              raw: data
            }
          }
        }
      })
      .addCase(processWebhook.rejected, (state, action) => {
        console.error('Webhook processing error:', action.payload)
      })
  }
})

// Export actions
export const {
  setCurrentPayment,
  clearCurrentPayment,
  setPaymentDetails,
  clearPaymentDetails,
  setPaymentUrl,
  clearPaymentUrl,
  resetPaymentState,
  setPaymentFilters,
  clearPaymentFilters,
  setPaymentSort,
  addPaymentToList,
  updatePaymentInList,
  removePaymentFromList,
  handlePaymentInitSuccess,
  handlePaymentVerifySuccess,
  handlePaymentRetrySuccess,
  handleWebhookEvent
} = paymentSlice.actions

// Export reducer
export default paymentSlice.reducer

// Export selectors
export const selectAllPayments = (state) => state.payments.payments
export const selectCurrentPayment = (state) => state.payments.currentPayment
export const selectPaymentDetails = (state) => state.payments.paymentDetails
export const selectPaymentUrl = (state) => state.payments.paymentUrl
export const selectPaymentStatus = (state) => state.payments.status
export const selectPaymentError = (state) => state.payments.error
export const selectPaymentFilters = (state) => state.payments.filters
export const selectPaymentSort = (state) => state.payments.sort

// Helper selectors
export const selectPaymentById = (state, id) => {
  return state.payments.payments.find(payment => payment._id === id)
}

export const selectPaymentByReference = (state, reference) => {
  return state.payments.payments.find(payment => payment.reference === reference)
}

export const selectPaymentsByStatus = (state, status) => {
  return state.payments.payments.filter(payment => payment.status === status)
}

export const selectPaymentsByBookingId = (state, bookingId) => {
  return state.payments.payments.filter(payment => payment.bookingId === bookingId)
}

export const selectSuccessfulPayments = (state) => {
  return state.payments.payments.filter(payment => payment.status === 'success')
}

export const selectFailedPayments = (state) => {
  return state.payments.payments.filter(payment => payment.status === 'failed')
}