/* eslint-disable no-unused-vars */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toast } from 'sonner'
import api from '../../utils/server'

// Async thunks for portfolio operations
export const getPortfolioItems = createAsyncThunk(
  'portfolio/getPortfolioItems',
  async (queryParams, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/portfolio', { params: queryParams })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch portfolio items'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getPortfolioItem = createAsyncThunk(
  'portfolio/getPortfolioItem',
  async (portfolioId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/portfolio/${portfolioId}`)
      return response.data.portfolio
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch portfolio item'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getFeaturedPortfolioItems = createAsyncThunk(
  'portfolio/getFeaturedPortfolioItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/portfolio/featured')
      return response.data.portfolios
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch featured portfolio items'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const getPortfolioCategories = createAsyncThunk(
  'portfolio/getPortfolioCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/portfolio/categories')
      return response.data.categories
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch portfolio categories'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const createPortfolioItem = createAsyncThunk(
  'portfolio/createPortfolioItem',
  async (portfolioData, { rejectWithValue }) => {
    try {
      // If there are files, use FormData
      let formData
      if (portfolioData.images && portfolioData.images.length > 0 && portfolioData.images[0] instanceof File) {
        formData = new FormData()
        
        // Add all non-file fields
        Object.keys(portfolioData).forEach(key => {
          if (key !== 'images') {
            if (typeof portfolioData[key] === 'object') {
              formData.append(key, JSON.stringify(portfolioData[key]))
            } else {
              formData.append(key, portfolioData[key])
            }
          }
        })
        
        // Add files
        portfolioData.images.forEach((image, index) => {
          formData.append(`images`, image)
        })
      }
      
      const response = await api.post('/api/portfolio', formData || portfolioData, {
        headers: formData ? { 'Content-Type': 'multipart/form-data' } : undefined
      })
      
      toast.success('Portfolio item created successfully')
      return response.data.portfolio
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create portfolio item'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const updatePortfolioItem = createAsyncThunk(
  'portfolio/updatePortfolioItem',
  async ({ id, portfolioData }, { rejectWithValue }) => {
    try {
      // If there are files, use FormData
      let formData
      if (portfolioData.images && portfolioData.images.length > 0 && portfolioData.images[0] instanceof File) {
        formData = new FormData()
        
        // Add all non-file fields
        Object.keys(portfolioData).forEach(key => {
          if (key !== 'images') {
            if (typeof portfolioData[key] === 'object') {
              formData.append(key, JSON.stringify(portfolioData[key]))
            } else {
              formData.append(key, portfolioData[key])
            }
          }
        })
        
        // Add files
        portfolioData.images.forEach((image, index) => {
          formData.append(`images`, image)
        })
      }
      
      const response = await api.patch(`/api/portfolio/${id}`, formData || portfolioData, {
        headers: formData ? { 'Content-Type': 'multipart/form-data' } : undefined
      })
      
      toast.success('Portfolio item updated successfully')
      return response.data.portfolio
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update portfolio item'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const deletePortfolioItem = createAsyncThunk(
  'portfolio/deletePortfolioItem',
  async (portfolioId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/portfolio/${portfolioId}`)
      toast.success('Portfolio item deleted successfully')
      return { id: portfolioId, ...response.data }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete portfolio item'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const searchPortfolioItems = createAsyncThunk(
  'portfolio/searchPortfolioItems',
  async (searchTerm, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/portfolio', { params: { search: searchTerm } })
      return response.data.portfolios
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to search portfolio items'
      toast.error(errorMessage)
      return rejectWithValue(error.response?.data || { message: errorMessage })
    }
  }
)

export const incrementPortfolioView = createAsyncThunk(
  'portfolio/incrementView',
  async (portfolioId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/portfolio/${portfolioId}/view`)
      return response.data
    } catch (error) {
      // Don't show error for view count as it's not critical
      return rejectWithValue(error.response?.data || { message: 'Failed to increment view count' })
    }
  }
)

// Initial state
const initialState = {
  portfolioItems: [],
  featuredPortfolioItems: [],
  portfolioCategories: [],
  currentPortfolioItem: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  filters: {
    category: null,
    tags: [],
    featured: null
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
  },
  viewCounts: {} // Track view counts locally for optimistic updates
}

// Create slice
const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    // Set current portfolio item
    setCurrentPortfolioItem: (state, action) => {
      state.currentPortfolioItem = action.payload
    },
    
    // Clear current portfolio item
    clearCurrentPortfolioItem: (state) => {
      state.currentPortfolioItem = null
    },
    
    // Reset portfolio state
    resetPortfolioState: (state) => {
      state.portfolioItems = []
      state.featuredPortfolioItems = []
      state.portfolioCategories = []
      state.currentPortfolioItem = null
      state.status = 'idle'
      state.error = null
      state.filters = initialState.filters
      state.pagination = initialState.pagination
      state.sort = initialState.sort
      state.search = initialState.search
      state.viewCounts = {}
    },
    
    // Set filters
    setPortfolioFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    // Clear filters
    clearPortfolioFilters: (state) => {
      state.filters = initialState.filters
    },
    
    // Set sort options
    setPortfolioSort: (state, action) => {
      state.sort = { ...state.sort, ...action.payload }
    },
    
    // Set search term
    setSearchTerm: (state, action) => {
      state.search.term = action.payload
    },
    
    // Set search results
    setSearchResults: (state, action) => {
      state.search.results = action.payload
    },
    
    // Add portfolio item to the list (for optimistic updates)
    addPortfolioItemToList: (state, action) => {
      state.portfolioItems.unshift(action.payload)
    },
    
    // Update portfolio item in the list
    updatePortfolioItemInList: (state, action) => {
      const index = state.portfolioItems.findIndex(item => item._id === action.payload._id)
      if (index !== -1) {
        state.portfolioItems[index] = action.payload
      }
      
      // Also update featured portfolio items if it's there
      const featuredIndex = state.featuredPortfolioItems.findIndex(item => item._id === action.payload._id)
      if (featuredIndex !== -1) {
        state.featuredPortfolioItems[featuredIndex] = action.payload
      }
      
      // Update current portfolio item if it's the same
      if (state.currentPortfolioItem && state.currentPortfolioItem._id === action.payload._id) {
        state.currentPortfolioItem = action.payload
      }
    },
    
    // Remove portfolio item from the list
    removePortfolioItemFromList: (state, action) => {
      state.portfolioItems = state.portfolioItems.filter(item => item._id !== action.payload)
      state.featuredPortfolioItems = state.featuredPortfolioItems.filter(item => item._id !== action.payload)
      
      // Clear current portfolio item if it's the one being deleted
      if (state.currentPortfolioItem && state.currentPortfolioItem._id === action.payload) {
        state.currentPortfolioItem = null
      }
    },
    
    // Set featured portfolio items
    setFeaturedPortfolioItems: (state, action) => {
      state.featuredPortfolioItems = action.payload
    },
    
    // Set portfolio categories
    setPortfolioCategories: (state, action) => {
      state.portfolioCategories = action.payload
    },
    
    // Increment view count (optimistic update)
    incrementViewCountOptimistic: (state, action) => {
      const portfolioId = action.payload
      
      // Update view counts locally
      state.viewCounts[portfolioId] = (state.viewCounts[portfolioId] || 0) + 1
      
      // Update in portfolio items list
      const index = state.portfolioItems.findIndex(item => item._id === portfolioId)
      if (index !== -1) {
        state.portfolioItems[index] = {
          ...state.portfolioItems[index],
          viewCount: (state.portfolioItems[index].viewCount || 0) + 1
        }
      }
      
      // Update in featured portfolio items
      const featuredIndex = state.featuredPortfolioItems.findIndex(item => item._id === portfolioId)
      if (featuredIndex !== -1) {
        state.featuredPortfolioItems[featuredIndex] = {
          ...state.featuredPortfolioItems[featuredIndex],
          viewCount: (state.featuredPortfolioItems[featuredIndex].viewCount || 0) + 1
        }
      }
      
      // Update current portfolio item
      if (state.currentPortfolioItem && state.currentPortfolioItem._id === portfolioId) {
        state.currentPortfolioItem = {
          ...state.currentPortfolioItem,
          viewCount: (state.currentPortfolioItem.viewCount || 0) + 1
        }
      }
    },
    
    // Add to wishlist (for future wishlist functionality)
    addToWishlist: (state, action) => {
      // This would be implemented when you add wishlist functionality
      console.log('Added to wishlist:', action.payload)
    },
    
    // Remove from wishlist
    removeFromWishlist: (state, action) => {
      // This would be implemented when you add wishlist functionality
      console.log('Removed from wishlist:', action.payload)
    }
  },
  extraReducers: (builder) => {
    // Get portfolio items
    builder
      .addCase(getPortfolioItems.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getPortfolioItems.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.portfolioItems = action.payload.portfolios || action.payload
        state.pagination = action.payload.pagination || initialState.pagination
      })
      .addCase(getPortfolioItems.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Get single portfolio item
    builder
      .addCase(getPortfolioItem.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getPortfolioItem.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.currentPortfolioItem = action.payload
        
        // Increment view count when item is viewed
        if (action.payload._id) {
          state.viewCounts[action.payload._id] = (state.viewCounts[action.payload._id] || 0) + 1
        }
      })
      .addCase(getPortfolioItem.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Get featured portfolio items
    builder
      .addCase(getFeaturedPortfolioItems.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getFeaturedPortfolioItems.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.featuredPortfolioItems = action.payload
      })
      .addCase(getFeaturedPortfolioItems.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Get portfolio categories
    builder
      .addCase(getPortfolioCategories.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getPortfolioCategories.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.portfolioCategories = action.payload
      })
      .addCase(getPortfolioCategories.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Create portfolio item
    builder
      .addCase(createPortfolioItem.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(createPortfolioItem.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Add to the beginning of the list
        state.portfolioItems.unshift(action.payload)
        // Set as current portfolio item
        state.currentPortfolioItem = action.payload
      })
      .addCase(createPortfolioItem.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Update portfolio item
    builder
      .addCase(updatePortfolioItem.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(updatePortfolioItem.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Update in the list
        const index = state.portfolioItems.findIndex(item => item._id === action.payload._id)
        if (index !== -1) {
          state.portfolioItems[index] = action.payload
        }
        
        // Update in featured portfolio items if it's there
        const featuredIndex = state.featuredPortfolioItems.findIndex(item => item._id === action.payload._id)
        if (featuredIndex !== -1) {
          state.featuredPortfolioItems[featuredIndex] = action.payload
        }
        
        // Update current portfolio item if it's the same
        if (state.currentPortfolioItem && state.currentPortfolioItem._id === action.payload._id) {
          state.currentPortfolioItem = action.payload
        }
      })
      .addCase(updatePortfolioItem.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Delete portfolio item
    builder
      .addCase(deletePortfolioItem.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(deletePortfolioItem.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Remove from the lists
        state.portfolioItems = state.portfolioItems.filter(item => item._id !== action.payload.id)
        state.featuredPortfolioItems = state.featuredPortfolioItems.filter(item => item._id !== action.payload.id)
        
        // Clear current portfolio item if it's the one being deleted
        if (state.currentPortfolioItem && state.currentPortfolioItem._id === action.payload.id) {
          state.currentPortfolioItem = null
        }
      })
      .addCase(deletePortfolioItem.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Search portfolio items
    builder
      .addCase(searchPortfolioItems.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(searchPortfolioItems.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.search.results = action.payload
      })
      .addCase(searchPortfolioItems.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    
    // Increment view count
    builder
      .addCase(incrementPortfolioView.pending, (state) => {
        // Don't change status for view count as it's not critical
      })
      .addCase(incrementPortfolioView.fulfilled, (state, action) => {
        // Update view counts if needed
        const { portfolioId, viewCount } = action.payload
        
        // Update in portfolio items list
        const index = state.portfolioItems.findIndex(item => item._id === portfolioId)
        if (index !== -1) {
          state.portfolioItems[index] = {
            ...state.portfolioItems[index],
            viewCount
          }
        }
        
        // Update in featured portfolio items
        const featuredIndex = state.featuredPortfolioItems.findIndex(item => item._id === portfolioId)
        if (featuredIndex !== -1) {
          state.featuredPortfolioItems[featuredIndex] = {
            ...state.featuredPortfolioItems[featuredIndex],
            viewCount
          }
        }
        
        // Update current portfolio item
        if (state.currentPortfolioItem && state.currentPortfolioItem._id === portfolioId) {
          state.currentPortfolioItem = {
            ...state.currentPortfolioItem,
            viewCount
          }
        }
      })
      .addCase(incrementPortfolioView.rejected, (state, action) => {
        console.error('Failed to increment view count:', action.payload)
      })
  }
})

// Export actions
export const {
  setCurrentPortfolioItem,
  clearCurrentPortfolioItem,
  resetPortfolioState,
  setPortfolioFilters,
  clearPortfolioFilters,
  setPortfolioSort,
  setSearchTerm,
  setSearchResults,
  addPortfolioItemToList,
  updatePortfolioItemInList,
  removePortfolioItemFromList,
  setFeaturedPortfolioItems,
  setPortfolioCategories,
  incrementViewCountOptimistic,
  addToWishlist,
  removeFromWishlist
} = portfolioSlice.actions

// Export reducer
export default portfolioSlice.reducer

// Export selectors
export const selectAllPortfolioItems = (state) => state.portfolio.portfolioItems
export const selectFeaturedPortfolioItems = (state) => state.portfolio.featuredPortfolioItems
export const selectPortfolioCategories = (state) => state.portfolio.portfolioCategories
export const selectCurrentPortfolioItem = (state) => state.portfolio.currentPortfolioItem
export const selectPortfolioStatus = (state) => state.portfolio.status
export const selectPortfolioError = (state) => state.portfolio.error
export const selectPortfolioFilters = (state) => state.portfolio.filters
export const selectPortfolioPagination = (state) => state.portfolio.pagination
export const selectPortfolioSort = (state) => state.portfolio.sort
export const selectPortfolioSearch = (state) => state.portfolio.search
export const selectViewCounts = (state) => state.portfolio.viewCounts

// Helper selectors
export const selectPortfolioItemById = (state, id) => {
  return state.portfolio.portfolioItems.find(item => item._id === id)
}

export const selectPortfolioItemsByCategory = (state, category) => {
  return state.portfolio.portfolioItems.filter(item => item.category === category)
}

export const selectPortfolioItemsByTag = (state, tag) => {
  return state.portfolio.portfolioItems.filter(item => 
    item.tags && item.tags.includes(tag)
  )
}

export const selectFeaturedPortfolioItemsOnly = (state) => {
  return state.portfolio.portfolioItems.filter(item => item.featured)
}

export const selectPortfolioItemViewCount = (state, id) => {
  return state.portfolio.viewCounts[id] || 0
}