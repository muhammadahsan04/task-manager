import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../config/api';

export const checkAuthStatus = createAsyncThunk('auth/checkStatus', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/auth/status');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to check auth status');
  }
});

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async ({ name, email, password }, { rejectWithValue }) => {
  try {
    await api.post('/auth/register', { name, email, password });
    const loginResponse = await api.post('/auth/login', { email, password });
    return loginResponse.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    // swallow
  }
  return true;
});

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSubmitting: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateUser(state, action) {
      state.user = action.payload;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = Boolean(action.payload?.authenticated);
        state.user = action.payload?.user || null;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(login.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.isAuthenticated = true;
        state.user = action.payload?.user || null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(register.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.isAuthenticated = true;
        state.user = action.payload?.user || null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || 'Registration failed';
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.isSubmitting = false;
        state.error = null;
      });
  },
});

export const { updateUser, clearAuthError } = authSlice.actions;
export default authSlice.reducer;





