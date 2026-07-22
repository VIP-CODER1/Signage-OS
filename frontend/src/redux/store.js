import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import displayReducer from './slices/displaySlice';
import uploadReducer from './slices/uploadSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    displays: displayReducer,
    upload: uploadReducer,
  },
  devTools: import.meta.env.DEV,
});
