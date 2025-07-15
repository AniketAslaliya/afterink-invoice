import { configureStore } from '@reduxjs/toolkit';
import invoicesReducer from './invoicesSlice';
import clientsReducer from './clientsSlice';
import projectsReducer from './projectsSlice';
import dashboardReducer from './dashboardSlice';
import bonusesReducer from './bonusesSlice';
import expensesReducer from './expensesSlice';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

const store = configureStore({
  reducer: {
    invoices: invoicesReducer,
    clients: clientsReducer,
    projects: projectsReducer,
    dashboard: dashboardReducer,
    bonuses: bonusesReducer,
    expenses: expensesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store; 