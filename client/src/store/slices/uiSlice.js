import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  showCreateTeamModal: false,
  showCreateTaskModal: false,
  showEditTaskModal: false,
  showEditTeamModal: false,
  selectedTeamId: null,
  editingTaskId: null,
  editingTeamId: null,
  teamsRefreshToken: 0,
  tasksRefreshToken: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openCreateTeamModal(state) {
      state.showCreateTeamModal = true;
    },
    closeCreateTeamModal(state) {
      state.showCreateTeamModal = false;
    },
    openCreateTaskModal(state) {
      state.showCreateTaskModal = true;
    },
    closeCreateTaskModal(state) {
      state.showCreateTaskModal = false;
    },
    openEditTaskModal(state, action) {
      state.showEditTaskModal = true;
      state.editingTaskId = action.payload || null;
    },
    closeEditTaskModal(state) {
      state.showEditTaskModal = false;
      state.editingTaskId = null;
    },
    openEditTeamModal(state, action) {
      state.showEditTeamModal = true;
      state.editingTeamId = action.payload || null;
    },
    closeEditTeamModal(state) {
      state.showEditTeamModal = false;
      state.editingTeamId = null;
    },
    setSelectedTeam(state, action) {
      state.selectedTeamId = action.payload;
    },
    bumpTeamsRefresh(state) {
      state.teamsRefreshToken += 1;
    },
    bumpTasksRefresh(state) {
      state.tasksRefreshToken += 1;
    },
  },
});

export const {
  openCreateTeamModal,
  closeCreateTeamModal,
  openCreateTaskModal,
  closeCreateTaskModal,
  openEditTaskModal,
  closeEditTaskModal,
  openEditTeamModal,
  closeEditTeamModal,
  setSelectedTeam,
  bumpTeamsRefresh,
  bumpTasksRefresh,
} = uiSlice.actions;

export default uiSlice.reducer;





