import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toast } from 'sonner'
import api from '@/utils/server'

// Async thunks for rental operations
export const getRentals = createAsyncThunk(
  'rentals/getRentals',
  async (queryParams, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/rentals', { params: queryParams })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch rentals'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getRental = createAsyncThunk(
  'rentals/getRental',
  async (rentalId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/rentals/${rentalId}`)
      return response.data.rental
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch rental'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getFeaturedRentals = createAsyncThunk(
  'rentals/getFeaturedRentals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/rentals/featured')
      return response.data.rentals
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch featured rentals'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getRentalCategories = createAsyncThunk(
  'rentals/getRentalCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/rentals/categories')
      return response.data.categories
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch rental categories'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const createRental = createAsyncThunk(
  'rentals/createRental',
  async (rentalData, { rejectWithValue }) => {
    try {
      // If there are files, use FormData
      let formData
      if (rentalData.images && rentalData.images.length > 0 && rentalData.images[0] instanceof File) {
        formData = new FormData()
        
        // Add all non-file fields
        Object.keys(rentalData).forEach(key => {
          if (key !== 'images') {
            if (typeof rentalData[key] === 'object') {
              formData.append(key, JSON.stringify(rentalData[key]))
            } else {
              formData.append(key, rentalData[key])
            }
          }
        })
        
        // Add files
        rentalData.images.forEach((image) => {
          formData.append(`images`, image)
        })
      }
      
      const response = await api.post('/api/rentals', formData || rentalData, {
        headers: formData ? { 'Content-Type': 'multipart/form-data' } : undefined
      })
      
      toast.success('Rental item created successfully')
      return response.data.rental
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create rental'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const updateRental = createAsyncThunk(
  'rentals/updateRental',
  async ({ id, rentalData }, { rejectWithValue }) => {
    try {
      // If there are files, use FormData
      let formData
      if (rentalData.images && rentalData.images.length > 0 && rentalData.images[0] instanceof File) {
        formData = new FormData()
        
        // Add all non-file fields
        Object.keys(rentalData).forEach(key => {
          if (key !== 'images') {
            if (typeof rentalData[key] === 'object') {
              formData.append(key, JSON.stringify(rentalData[key]))
            } else {
              formData.append(key, rentalData[key])
            }
          }
        })
        
        // Add files
        rentalData.images.forEach((image) => {
          formData.append(`images`, image)
        })
      }
      
      const response = await api.put(`/api/rentals/${id}`, formData || rentalData, {
        headers: formData ? { 'Content-Type': 'multipart/form-data' } : undefined
      })
      
      toast.success('Rental item updated successfully')
      return response.data.rental
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update rental'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const deleteRental = createAsyncThunk(
  'rentals/deleteRental',
  async (rentalId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/rentals/${rentalId}`)
      toast.success('Rental item deleted successfully')
      return { id: rentalId, ...response.data }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete rental'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const searchRentals = createAsyncThunk(
  'rentals/searchRentals',
  async (searchTerm, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/rentals', { params: { search: searchTerm } })
      return response.data.rentals
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to search rentals'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

// Initial state
const initialState = {
  rentals: [],
  featuredRentals: [],
  rentalCategories: [],
  currentRental: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  filters: {
    category: null,
    tags: [],
    featured: null,
    minPrice: null,
    maxPrice: null,
    inStock: null
  },
  pagination: {
    total: 0,
    page: 1,
    pages: 1,
    limit: 12
  },
  sort: {
    field: 'createdAt',
    order: 'desc' // 'asc' | 'desc'
  },
  search: {
    term: '',
    results: []
  }
}

// Create slice
const rentalSlice = createSlice({
  name: 'rentals',
  initialState,
  reducers: {
    // Set current rental
    setCurrentRental: (state, action) => {
      state.currentRental = action.payload
    },
    
    // Clear current rental
    clearCurrentRental: (state) => {
      state.currentRental = null
    },
    
    // Reset rental state
    resetRentalState: (state) => {
      state.rentals = []
      state.featuredRentals = []
      state.rentalCategories = []
      state.currentRental = null
      state.status = 'idle'
      state.error = null
      state.filters = initialState.filters
      state.pagination = initialState.pagination
      state.sort = initialState.sort
      state.search = initialState.search
    },
    
    // Set filters
    setRentalFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    // Clear filters
    clearRentalFilters: (state) => {
      state.filters = initialState.filters
    },
    
    // Set sort options
    setRentalSort: (state, action) => {
      state.sort = { ...state.sort, ...action.payload }
    },
    
    // Set search term
    setSearchTerm: (state, action) => {
      state.search.term = action.payload
    },
    
    // Add rental to the list (for optimistic updates)
    addRentalToList: (state, action) => {
      state.rentals.unshift(action.payload)
    },
    
    // Update rental in the list
    updateRentalInList: (state, action) => {
      const index = state.rentals.findIndex(rental => rental._id === action.payload._id)
      if (index !== -1) {
        state.rentals[index] = action.payload
      }
      
      // Also update featured rentals if it's there
      const featuredIndex = state.featuredRentals.findIndex(rental => rental._id === action.payload._id)
      if (featuredIndex !== -1) {
        state.featuredRentals[featuredIndex] = action.payload
      }
      
      // Update current rental if it's the same
      if (state.currentRental && state.currentRental._id === action.payload._id) {
        state.currentRental = action.payload
      }
    },
    
    // Remove rental from the list
    removeRentalFromList: (state, action) => {
      state.rentals = state.rentals.filter(rental => rental._id !== action.payload)
      state.featuredRentals = state.featuredRentals.filter(rental => rental._id !== action.payload)
      
      // Clear current rental if it's the one being deleted
      if (state.currentRental && state.currentRental._id === action.payload) {
        state.currentRental = null
      }
    },
    
    // Set featured rentals
    setFeaturedRentals: (state, action) => {
      state.featuredRentals = action.payload
    },
    
    // Set rental categories
    setRentalCategories: (state, action) => {
      state.rentalCategories = action.payload
    },
    
    // Set search results
    setSearchResults: (state, action) => {
      state.search.results = action.payload
    },
    
    // Add rental to cart (for future cart functionality)
    addRentalToCart: (state, action) => {
      // This would be implemented when you add cart functionality
      console.log('Added to cart:', action.payload)
    },
    
    // Remove rental from cart
    removeRentalFromCart: (state, action) => {
      // This would be implemented when you add cart functionality
      console.log('Removed from cart:', action.payload)
    }
  },
  extraReducers: (builder) => {
    // Get rentals
    builder
      .addCase(getRentals.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getRentals.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.rentals = action.payload.rentals || action.payload
        state.pagination = action.payload.pagination || initialState.pagination
      })
      .addCase(getRentals.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Get single rental
    builder
      .addCase(getRental.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getRental.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.currentRental = action.payload
      })
      .addCase(getRental.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Get featured rentals
    builder
      .addCase(getFeaturedRentals.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getFeaturedRentals.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.featuredRentals = action.payload
      })
      .addCase(getFeaturedRentals.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Get rental categories
    builder
      .addCase(getRentalCategories.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getRentalCategories.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.rentalCategories = action.payload
      })
      .addCase(getRentalCategories.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Create rental
    builder
      .addCase(createRental.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(createRental.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Add to the beginning of the list
        state.rentals.unshift(action.payload)
        // Set as current rental
        state.currentRental = action.payload
      })
      .addCase(createRental.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Update rental
    builder
      .addCase(updateRental.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(updateRental.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Update in the list
        const index = state.rentals.findIndex(rental => rental._id === action.payload._id)
        if (index !== -1) {
          state.rentals[index] = action.payload
        }
        
        // Update in featured rentals if it's there
        const featuredIndex = state.featuredRentals.findIndex(rental => rental._id === action.payload._id)
        if (featuredIndex !== -1) {
          state.featuredRentals[featuredIndex] = action.payload
        }
        
        // Update current rental if it's the same
        if (state.currentRental && state.currentRental._id === action.payload._id) {
          state.currentRental = action.payload
        }
      })
      .addCase(updateRental.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Delete rental
    builder
      .addCase(deleteRental.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(deleteRental.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Remove from the lists
        state.rentals = state.rentals.filter(rental => rental._id !== action.payload.id)
        state.featuredRentals = state.featuredRentals.filter(rental => rental._id !== action.payload.id)
        
        // Clear current rental if it's the one being deleted
        if (state.currentRental && state.currentRental._id === action.payload.id) {
          state.currentRental = null
        }
      })
      .addCase(deleteRental.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Search rentals
    builder
      .addCase(searchRentals.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(searchRentals.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.search.results = action.payload
      })
      .addCase(searchRentals.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  }
})

// Export actions
export const {
  setCurrentRental,
  clearCurrentRental,
  resetRentalState,
  setRentalFilters,
  clearRentalFilters,
  setRentalSort,
  setSearchTerm,
  addRentalToList,
  updateRentalInList,
  removeRentalFromList,
  setFeaturedRentals,
  setRentalCategories,
  setSearchResults,
  addRentalToCart,
  removeRentalFromCart
} = rentalSlice.actions

// Export reducer
export default rentalSlice.reducer

// Export selectors
export const selectAllRentals = (state) => state.rentals.rentals
export const selectFeaturedRentals = (state) => state.rentals.featuredRentals
export const selectRentalCategories = (state) => state.rentals.rentalCategories
export const selectCurrentRental = (state) => state.rentals.currentRental
export const selectRentalStatus = (state) => state.rentals.status
export const selectRentalError = (state) => state.rentals.error
export const selectRentalFilters = (state) => state.rentals.filters
export const selectRentalPagination = (state) => state.rentals.pagination
export const selectRentalSort = (state) => state.rentals.sort
export const selectRentalSearch = (state) => state.rentals.search

// Helper selectors
export const selectRentalById = (state, id) => {
  return state.rentals.rentals.find(rental => rental._id === id)
}

export const selectRentalsByCategory = (state, category) => {
  return state.rentals.rentals.filter(rental => rental.category === category)
}

export const selectRentalsByTag = (state, tag) => {
  return state.rentals.rentals.filter(rental => rental.tags && rental.tags.includes(tag))
}

export const selectRentalsInPriceRange = (state, minPrice, maxPrice) => {
  return state.rentals.rentals.filter(rental => 
    rental.basePrice >= minPrice && rental.basePrice <= maxPrice
  )
}

export const selectRentalsInStock = (state) => {
  return state.rentals.rentals.filter(rental => rental.inStock)
}

export const selectFeaturedRentalsOnly = (state) => {
  return state.rentals.rentals.filter(rental => rental.featured)
}