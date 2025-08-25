import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toast } from 'sonner'
import api from '../../utils/server'
import moment from 'moment';


// Async thunks for availability operations
export const getAvailability = createAsyncThunk(
  'availability/getAvailability',
  async (queryParams, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/availability', { params: queryParams })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch availability'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const setAvailability = createAsyncThunk(
  'availability/setAvailability',
  async (availabilityData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/availability', availabilityData)
      toast.success('Availability set successfully')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to set availability'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const blockSlot = createAsyncThunk(
  'availability/blockSlot',
  async (slotData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/availability/block', slotData)
      toast.success('Time slot blocked successfully')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to block time slot'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const deleteAvailability = createAsyncThunk(
  'availability/deleteAvailability',
  async (date, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/availability/${date}`)
      toast.success('Availability deleted successfully')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete availability'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

// Initial state
const initialState = {
  availability: [],
  currentAvailability: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  filters: {
    date: null,
    startDate: null,
    endDate: null
  },
  calendarView: 'month' // 'month' | 'week' | 'day'
}

// Create slice
const availabilitySlice = createSlice({
  name: 'availability',
  initialState,
  reducers: {
    // Set current availability
    setCurrentAvailability: (state, action) => {
      state.currentAvailability = action.payload
    },
    
    // Clear current availability
    clearCurrentAvailability: (state) => {
      state.currentAvailability = null
    },
    
    // Reset availability state
    resetAvailabilityState: (state) => {
      state.availability = []
      state.currentAvailability = null
      state.status = 'idle'
      state.error = null
      state.filters = initialState.filters
      state.calendarView = initialState.calendarView
    },
    
    // Set filters
    setAvailabilityFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    // Clear filters
    clearAvailabilityFilters: (state) => {
      state.filters = initialState.filters
    },
    
    // Set calendar view
    setCalendarView: (state, action) => {
      state.calendarView = action.payload
    },
    
    // Add or update availability in the list
    updateAvailabilityInList: (state, action) => {
      const index = state.availability.findIndex(item => 
        moment(item.date).isSame(moment(action.payload.date), 'day')
      )
      
      if (index !== -1) {
        // Update existing availability
        state.availability[index] = action.payload
      } else {
        // Add new availability
        state.availability.push(action.payload)
        // Sort by date
        state.availability.sort((a, b) => moment(a.date).diff(moment(b.date)))
      }
    },
    
    // Remove availability from the list
    removeAvailabilityFromList: (state, action) => {
      state.availability = state.availability.filter(item => 
        !moment(item.date).isSame(moment(action.payload), 'day')
      )
    },
    
    // Update a specific slot in availability
    updateSlotInAvailability: (state, action) => {
      const { date, slot } = action.payload
      
      const availabilityIndex = state.availability.findIndex(item => 
        moment(item.date).isSame(moment(date), 'day')
      )
      
      if (availabilityIndex !== -1) {
        const availability = state.availability[availabilityIndex]
        const slotIndex = availability.slots.findIndex(s => 
          s.start === slot.start && s.end === slot.end
        )
        
        if (slotIndex !== -1) {
          // Update existing slot
          state.availability[availabilityIndex].slots[slotIndex] = slot
        } else {
          // Add new slot
          state.availability[availabilityIndex].slots.push(slot)
        }
      }
    },
    
    // Block a time slot
    blockTimeSlot: (state, action) => {
      const { date, slot } = action.payload
      
      const availabilityIndex = state.availability.findIndex(item => 
        moment(item.date).isSame(moment(date), 'day')
      )
      
      if (availabilityIndex !== -1) {
        const availability = state.availability[availabilityIndex]
        const slotIndex = availability.slots.findIndex(s => 
          s.start === slot.start && s.end === slot.end
        )
        
        if (slotIndex !== -1) {
          // Update existing slot status to 'blocked'
          state.availability[availabilityIndex].slots[slotIndex].status = 'blocked'
          state.availability[availabilityIndex].slots[slotIndex].note = slot.note || ''
        } else {
          // Add new blocked slot
          state.availability[availabilityIndex].slots.push({
            ...slot,
            status: 'blocked'
          })
        }
      }
    }
  },
  extraReducers: (builder) => {
    // Get availability
    builder
      .addCase(getAvailability.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getAvailability.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.availability = Array.isArray(action.payload) ? action.payload : [action.payload]
      })
      .addCase(getAvailability.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Set availability
    builder
      .addCase(setAvailability.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(setAvailability.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Update or add the availability
        const index = state.availability.findIndex(item => 
          moment(item.date).isSame(moment(action.payload.date), 'day')
        )
        
        if (index !== -1) {
          state.availability[index] = action.payload
        } else {
          state.availability.push(action.payload)
          // Sort by date
          state.availability.sort((a, b) => moment(a.date).diff(moment(b.date)))
        }
        
        // Set as current availability
        state.currentAvailability = action.payload
      })
      .addCase(setAvailability.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Block slot
    builder
      .addCase(blockSlot.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(blockSlot.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Update the availability with the blocked slot
        const { date, ...slotData } = action.payload
        
        const availabilityIndex = state.availability.findIndex(item => 
          moment(item.date).isSame(moment(date), 'day')
        )
        
        if (availabilityIndex !== -1) {
          const availability = state.availability[availabilityIndex]
          const slotIndex = availability.slots.findIndex(s => 
            s.start === slotData.start && s.end === slotData.end
          )
          
          if (slotIndex !== -1) {
            // Update existing slot
            state.availability[availabilityIndex].slots[slotIndex] = {
              ...slotData,
              status: 'blocked'
            }
          } else {
            // Add new blocked slot
            state.availability[availabilityIndex].slots.push({
              ...slotData,
              status: 'blocked'
            })
          }
          
          // Update current availability if it's the same
          if (state.currentAvailability && 
              moment(state.currentAvailability.date).isSame(moment(date), 'day')) {
            state.currentAvailability = state.availability[availabilityIndex]
          }
        }
      })
      .addCase(blockSlot.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Delete availability
    builder
      .addCase(deleteAvailability.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(deleteAvailability.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Remove the availability from the list
        state.availability = state.availability.filter(item => 
          !moment(item.date).isSame(moment(action.payload.date), 'day')
        )
        
        // Clear current availability if it's the one being deleted
        if (state.currentAvailability && 
            moment(state.currentAvailability.date).isSame(moment(action.payload.date), 'day')) {
          state.currentAvailability = null
        }
      })
      .addCase(deleteAvailability.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  }
})

// Export actions
export const {
  setCurrentAvailability,
  clearCurrentAvailability,
  resetAvailabilityState,
  setAvailabilityFilters,
  clearAvailabilityFilters,
  setCalendarView,
  updateAvailabilityInList,
  removeAvailabilityFromList,
  updateSlotInAvailability,
  blockTimeSlot
} = availabilitySlice.actions

// Export reducer
export default availabilitySlice.reducer

// Export selectors
export const selectAllAvailability = (state) => state.availability.availability
export const selectCurrentAvailability = (state) => state.availability.currentAvailability
export const selectAvailabilityStatus = (state) => state.availability.status
export const selectAvailabilityError = (state) => state.availability.error
export const selectAvailabilityFilters = (state) => state.availability.filters
export const selectCalendarView = (state) => state.availability.calendarView

// Helper selectors
export const selectAvailabilityByDate = (state, date) => {
  return state.availability.availability.find(item => 
    moment(item.date).isSame(moment(date), 'day')
  )
}

export const selectAvailabilityByDateRange = (state, startDate, endDate) => {
  return state.availability.availability.filter(item => {
    const itemDate = moment(item.date)
    return itemDate.isBetween(moment(startDate), moment(endDate), null, '[]')
  })
}

export const selectAvailableSlots = (state, date) => {
  const availability = selectAvailabilityByDate(state, date)
  return availability ? availability.slots.filter(slot => slot.status === 'available') : []
}

export const selectBlockedSlots = (state, date) => {
  const availability = selectAvailabilityByDate(state, date)
  return availability ? availability.slots.filter(slot => slot.status === 'blocked') : []
}

export const selectBookedSlots = (state, date) => {
  const availability = selectAvailabilityByDate(state, date)
  return availability ? availability.slots.filter(slot => slot.status === 'booked') : []
}