import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../config/api';
import { logout } from './authSlice';

// Async thunk to fetch teams - only fetches if data doesn't exist
export const fetchTeams = createAsyncThunk(
  'teams/fetchTeams',
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { teams, lastFetched } = state.teams;
      
      // If forceRefresh is false and teams data exists and was fetched recently (within last 5 minutes), don't fetch again
      if (!forceRefresh && teams.length > 0 && lastFetched) {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        if (lastFetched > fiveMinutesAgo) {
          // Return cached data - this will be handled in the fulfilled case
          return { teams, fromCache: true };
        }
      }
      
      // Fetch fresh data
      const response = await api.get('/teams');
      return { teams: response.data.teams || [], fromCache: false };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch teams');
    }
  }
);

// Force refresh teams (bypasses cache check)
export const refreshTeams = createAsyncThunk(
  'teams/refreshTeams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/teams');
      return response.data.teams || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to refresh teams');
    }
  }
);

const initialState = {
  teams: [],
  loading: false,
  error: null,
  lastFetched: null,
};

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    clearTeams(state) {
      state.teams = [];
      state.lastFetched = null;
      state.error = null;
    },
    addTeam(state, action) {
      state.teams.push(action.payload);
    },
    updateTeam(state, action) {
      const index = state.teams.findIndex(team => team.id === action.payload.id);
      if (index !== -1) {
        state.teams[index] = { ...state.teams[index], ...action.payload };
      }
    },
    removeTeam(state, action) {
      state.teams = state.teams.filter(team => team.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        // Only set loading if we don't have cached data
        if (!state.teams.length || !state.lastFetched) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload.fromCache) {
          state.teams = action.payload.teams;
          state.lastFetched = Date.now();
        }
        state.error = null;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch teams';
      })
      .addCase(refreshTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.teams = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(refreshTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to refresh teams';
      })
      // Clear teams when user logs out
      .addCase(logout.fulfilled, (state) => {
        state.teams = [];
        state.lastFetched = null;
        state.error = null;
        state.loading = false;
      });
  },
});

export const { clearTeams, addTeam, updateTeam, removeTeam } = teamsSlice.actions;
export default teamsSlice.reducer;

