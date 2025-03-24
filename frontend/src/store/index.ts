import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from './slices/taskSlice';
import authReducer from './slices/authSlice';
import departmentsReducer from './slices/departmentSlice';

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    auth: authReducer,
    departments: departmentsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 