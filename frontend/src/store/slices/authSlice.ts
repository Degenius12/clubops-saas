import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import apiClient from '../../config/api'

interface User {
  id: string
  email: string
  name: string
  role: 'owner' | 'manager' | 'dj' | 'security'
  club_id: string
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise'
  ownerName?: string
  clubName?: string
  phoneNumber?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  loading: boolean // alias for isLoading for compatibility
  error: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  loading: false,
  error: null,
  isAuthenticated: false,
}

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await apiClient.post('/api/auth/login', { email, password })
    return response.data
  }
)

export const registerClub = createAsyncThunk(
  'auth/register',
  async ({ 
    clubName, 
    subdomain, 
    ownerName, 
    email, 
    password 
  }: { 
    clubName: string
    subdomain: string
    ownerName: string
    email: string
    password: string 
  }) => {
    const response = await apiClient.post('/api/auth/register', {
      clubName,
      subdomain,
      ownerName,
      email,
      password
    })
    return response.data
  }
)

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ 
    clubName, 
    ownerName, 
    email, 
    password,
    phoneNumber 
  }: { 
    clubName: string
    ownerName: string
    email: string
    password: string
    phoneNumber?: string
  }) => {
    const response = await apiClient.post('/api/auth/register', {
      clubName,
      ownerName,
      email,
      password,
      phoneNumber
    })
    return response.data
  }
)

export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async (userData: any) => {
    const response = await apiClient.put('/api/auth/profile', userData)
    return response.data
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async () => {
    const response = await apiClient.get('/api/auth/me')
    return response.data
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
    },
    clearError: (state) => {
      state.error = null
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      localStorage.setItem('token', action.payload)
    }
  },
  extraReducers: (builder) => {
    // Login cases
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('token', action.payload.token)
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Login failed'
      })
      // Register cases
      .addCase(registerClub.pending, (state) => {
        state.isLoading = true
        state.loading = true
        state.error = null
      })
      .addCase(registerClub.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('token', action.payload.token)
      })
      .addCase(registerClub.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Registration failed'
      })
      // Register user cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('token', action.payload.token)
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Registration failed'
      })
      // Update user cases
      .addCase(updateUser.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.error.message || 'Update failed'
      })
      // Get current user cases
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
      })
  },
})

export const { logout, clearError, setToken } = authSlice.actions
export default authSlice.reducer
