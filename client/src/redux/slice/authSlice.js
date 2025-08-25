import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toast } from 'sonner'
import api from '../../utils/server'

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/login', { email, password }, { withCredentials: true })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data)
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/api/auth/logout', {}, { withCredentials: true })
      return null
    } catch (error) {
      return rejectWithValue(error.response.data)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload
        toast.success('Logged in successfully')
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        toast.error(action.payload.message || 'Login failed')
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.status = 'idle'
        toast.success('Logged out successfully')
      })
      .addCase(logout.rejected, (state, action) => {
        state.error = action.payload
        toast.error(action.payload.message || 'Logout failed')
      })
  }
})

export default authSlice.reducer