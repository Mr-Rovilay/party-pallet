import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toast } from 'sonner'
import api from '@/utils/server'

// Async thunks for testimonial operations
export const getTestimonials = createAsyncThunk(
  'testimonials/getTestimonials',
  async (queryParams, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/testimonials', { params: queryParams })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch testimonials'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getTestimonial = createAsyncThunk(
  'testimonials/getTestimonial',
  async (testimonialId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/testimonials/${testimonialId}`)
      return response.data.testimonial
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch testimonial'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getFeaturedTestimonials = createAsyncThunk(
  'testimonials/getFeaturedTestimonials',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/testimonials/featured')
      return response.data.testimonials
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch featured testimonials'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const createTestimonial = createAsyncThunk(
  'testimonials/createTestimonial',
  async (testimonialData, { rejectWithValue }) => {
    try {
      // If there's a file, use FormData
      let formData
      if (testimonialData.photo instanceof File) {
        formData = new FormData()
        Object.keys(testimonialData).forEach(key => {
          if (key !== 'photo') {
            formData.append(key, testimonialData[key])
          }
        })
        formData.append('photo', testimonialData.photo)
      }
      
      const response = await api.post('/api/testimonials', formData || testimonialData, {
        headers: formData ? { 'Content-Type': 'multipart/form-data' } : undefined
      })
      
      toast.success('Testimonial created successfully')
      return response.data.testimonial
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create testimonial'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const updateTestimonial = createAsyncThunk(
  'testimonials/updateTestimonial',
  async ({ id, testimonialData }, { rejectWithValue }) => {
    try {
      // If there's a file, use FormData
      let formData
      if (testimonialData.photo instanceof File) {
        formData = new FormData()
        Object.keys(testimonialData).forEach(key => {
          if (key !== 'photo') {
            formData.append(key, testimonialData[key])
          }
        })
        formData.append('photo', testimonialData.photo)
      }
      
      const response = await api.patch(`/api/testimonials/${id}`, formData || testimonialData, {
        headers: formData ? { 'Content-Type': 'multipart/form-data' } : undefined
      })
      
      toast.success('Testimonial updated successfully')
      return response.data.testimonial
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update testimonial'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const deleteTestimonial = createAsyncThunk(
  'testimonials/deleteTestimonial',
  async (testimonialId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/testimonials/${testimonialId}`)
      toast.success('Testimonial deleted successfully')
      return { id: testimonialId, ...response.data }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete testimonial'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const likeTestimonial = createAsyncThunk(
  'testimonials/likeTestimonial',
  async (testimonialId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/testimonials/${testimonialId}/like`)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to like testimonial'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

// Initial state
const initialState = {
  testimonials: [],
  featuredTestimonials: [],
  currentTestimonial: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  filters: {
    active: true,
    rating: null,
    category: null
  },
  pagination: {
    total: 0,
    page: 1,
    pages: 1,
    limit: 10
  },
  sort: {
    field: 'createdAt',
    order: 'desc' // 'asc' | 'desc'
  }
}

// Create slice
const testimonialSlice = createSlice({
  name: 'testimonials',
  initialState,
  reducers: {
    // Set current testimonial
    setCurrentTestimonial: (state, action) => {
      state.currentTestimonial = action.payload
    },
    
    // Clear current testimonial
    clearCurrentTestimonial: (state) => {
      state.currentTestimonial = null
    },
    
    // Reset testimonial state
    resetTestimonialState: (state) => {
      state.testimonials = []
      state.featuredTestimonials = []
      state.currentTestimonial = null
      state.status = 'idle'
      state.error = null
      state.filters = initialState.filters
      state.pagination = initialState.pagination
      state.sort = initialState.sort
    },
    
    // Set filters
    setTestimonialFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    // Clear filters
    clearTestimonialFilters: (state) => {
      state.filters = initialState.filters
    },
    
    // Set sort options
    setTestimonialSort: (state, action) => {
      state.sort = { ...state.sort, ...action.payload }
    },
    
    // Add testimonial to the list (for optimistic updates)
    addTestimonialToList: (state, action) => {
      state.testimonials.unshift(action.payload)
    },
    
    // Update testimonial in the list
    updateTestimonialInList: (state, action) => {
      const index = state.testimonials.findIndex(testimonial => testimonial._id === action.payload._id)
      if (index !== -1) {
        state.testimonials[index] = action.payload
      }
      
      // Also update featured testimonials if it's there
      const featuredIndex = state.featuredTestimonials.findIndex(testimonial => testimonial._id === action.payload._id)
      if (featuredIndex !== -1) {
        state.featuredTestimonials[featuredIndex] = action.payload
      }
      
      // Update current testimonial if it's the same
      if (state.currentTestimonial && state.currentTestimonial._id === action.payload._id) {
        state.currentTestimonial = action.payload
      }
    },
    
    // Remove testimonial from the list
    removeTestimonialFromList: (state, action) => {
      state.testimonials = state.testimonials.filter(testimonial => testimonial._id !== action.payload)
      state.featuredTestimonials = state.featuredTestimonials.filter(testimonial => testimonial._id !== action.payload)
      
      // Clear current testimonial if it's the one being deleted
      if (state.currentTestimonial && state.currentTestimonial._id === action.payload) {
        state.currentTestimonial = null
      }
    },
    
    // Set featured testimonials
    setFeaturedTestimonials: (state, action) => {
      state.featuredTestimonials = action.payload
    },
    
    // Like testimonial (optimistic update)
    likeTestimonialOptimistic: (state, action) => {
      const testimonialId = action.payload
      
      // Update in testimonials list
      const index = state.testimonials.findIndex(t => t._id === testimonialId)
      if (index !== -1) {
        state.testimonials[index] = {
          ...state.testimonials[index],
          likes: (state.testimonials[index].likes || 0) + 1
        }
      }
      
      // Update in featured testimonials
      const featuredIndex = state.featuredTestimonials.findIndex(t => t._id === testimonialId)
      if (featuredIndex !== -1) {
        state.featuredTestimonials[featuredIndex] = {
          ...state.featuredTestimonials[featuredIndex],
          likes: (state.featuredTestimonials[featuredIndex].likes || 0) + 1
        }
      }
      
      // Update current testimonial
      if (state.currentTestimonial && state.currentTestimonial._id === testimonialId) {
        state.currentTestimonial = {
          ...state.currentTestimonial,
          likes: (state.currentTestimonial.likes || 0) + 1
        }
      }
    }
  },
  extraReducers: (builder) => {
    // Get testimonials
    builder
      .addCase(getTestimonials.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getTestimonials.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.testimonials = action.payload.testimonials || action.payload
        state.pagination = action.payload.pagination || initialState.pagination
      })
      .addCase(getTestimonials.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Get single testimonial
    builder
      .addCase(getTestimonial.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getTestimonial.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.currentTestimonial = action.payload
      })
      .addCase(getTestimonial.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Get featured testimonials
    builder
      .addCase(getFeaturedTestimonials.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getFeaturedTestimonials.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.featuredTestimonials = action.payload
      })
      .addCase(getFeaturedTestimonials.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Create testimonial
    builder
      .addCase(createTestimonial.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(createTestimonial.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Add to the beginning of the list
        state.testimonials.unshift(action.payload)
        // Set as current testimonial
        state.currentTestimonial = action.payload
      })
      .addCase(createTestimonial.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Update testimonial
    builder
      .addCase(updateTestimonial.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(updateTestimonial.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Update in the list
        const index = state.testimonials.findIndex(testimonial => testimonial._id === action.payload._id)
        if (index !== -1) {
          state.testimonials[index] = action.payload
        }
        
        // Update in featured testimonials if it's there
        const featuredIndex = state.featuredTestimonials.findIndex(testimonial => testimonial._id === action.payload._id)
        if (featuredIndex !== -1) {
          state.featuredTestimonials[featuredIndex] = action.payload
        }
        
        // Update current testimonial if it's the same
        if (state.currentTestimonial && state.currentTestimonial._id === action.payload._id) {
          state.currentTestimonial = action.payload
        }
      })
      .addCase(updateTestimonial.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Delete testimonial
    builder
      .addCase(deleteTestimonial.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(deleteTestimonial.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Remove from the lists
        state.testimonials = state.testimonials.filter(testimonial => testimonial._id !== action.payload.id)
        state.featuredTestimonials = state.featuredTestimonials.filter(testimonial => testimonial._id !== action.payload.id)
        
        // Clear current testimonial if it's the one being deleted
        if (state.currentTestimonial && state.currentTestimonial._id === action.payload.id) {
          state.currentTestimonial = null
        }
      })
      .addCase(deleteTestimonial.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Like testimonial
    builder
      .addCase(likeTestimonial.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(likeTestimonial.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Update likes count in all relevant places
        const testimonialId = action.payload.testimonialId
        const likesCount = action.payload.likes
        
        // Update in testimonials list
        const index = state.testimonials.findIndex(t => t._id === testimonialId)
        if (index !== -1) {
          state.testimonials[index].likes = likesCount
        }
        
        // Update in featured testimonials
        const featuredIndex = state.featuredTestimonials.findIndex(t => t._id === testimonialId)
        if (featuredIndex !== -1) {
          state.featuredTestimonials[featuredIndex].likes = likesCount
        }
        
        // Update current testimonial
        if (state.currentTestimonial && state.currentTestimonial._id === testimonialId) {
          state.currentTestimonial.likes = likesCount
        }
      })
      .addCase(likeTestimonial.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  }
})

// Export actions
export const {
  setCurrentTestimonial,
  clearCurrentTestimonial,
  resetTestimonialState,
  setTestimonialFilters,
  clearTestimonialFilters,
  setTestimonialSort,
  addTestimonialToList,
  updateTestimonialInList,
  removeTestimonialFromList,
  setFeaturedTestimonials,
  likeTestimonialOptimistic
} = testimonialSlice.actions

// Export reducer
export default testimonialSlice.reducer

// Export selectors
export const selectAllTestimonials = (state) => state.testimonials.testimonials
export const selectFeaturedTestimonials = (state) => state.testimonials.featuredTestimonials
export const selectCurrentTestimonial = (state) => state.testimonials.currentTestimonial
export const selectTestimonialStatus = (state) => state.testimonials.status
export const selectTestimonialError = (state) => state.testimonials.error
export const selectTestimonialFilters = (state) => state.testimonials.filters
export const selectTestimonialPagination = (state) => state.testimonials.pagination
export const selectTestimonialSort = (state) => state.testimonials.sort

// Helper selectors
export const selectTestimonialById = (state, id) => {
  return state.testimonials.testimonials.find(testimonial => testimonial._id === id)
}

export const selectTestimonialsByRating = (state, rating) => {
  return state.testimonials.testimonials.filter(testimonial => testimonial.rating === rating)
}

export const selectTestimonialsByCategory = (state, category) => {
  return state.testimonials.testimonials.filter(testimonial => 
    testimonial.booking && testimonial.booking.event && testimonial.booking.event.type === category
  )
}

export const selectActiveTestimonials = (state) => {
  return state.testimonials.testimonials.filter(testimonial => testimonial.active)
}