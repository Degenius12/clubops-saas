import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import clubSlice from './slices/clubSlice'
import entertainerSlice from './slices/dancerSlice' // Renamed from dancerSlice (file will be renamed later)
import queueSlice from './slices/queueSlice'
import vipSlice from './slices/vipSlice'
import revenueSlice from './slices/revenueSlice'
import feesSlice from './slices/feesSlice'
import subscriptionSlice from './slices/subscriptionSlice'
// Fraud Prevention Slices
import shiftSlice from './slices/shiftSlice'
import doorStaffSlice from './slices/doorStaffSlice'
import vipHostSlice from './slices/vipHostSlice'
import securitySlice from './slices/securitySlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    club: clubSlice,
    entertainers: entertainerSlice, // Primary name
    dancers: entertainerSlice, // Backward compatibility alias
    queue: queueSlice,
    vip: vipSlice,
    revenue: revenueSlice,
    fees: feesSlice,
    subscription: subscriptionSlice,
    // Fraud Prevention Reducers
    shift: shiftSlice,
    doorStaff: doorStaffSlice,
    vipHost: vipHostSlice,
    security: securitySlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
