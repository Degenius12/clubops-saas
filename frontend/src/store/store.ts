import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import clubSlice from './slices/clubSlice'
import dancerSlice from './slices/dancerSlice'
import queueSlice from './slices/queueSlice'
import vipSlice from './slices/vipSlice'
import revenueSlice from './slices/revenueSlice'
import subscriptionSlice from './slices/subscriptionSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    club: clubSlice,
    dancers: dancerSlice,
    queue: queueSlice,
    vip: vipSlice,
    revenue: revenueSlice,
    subscription: subscriptionSlice,
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
