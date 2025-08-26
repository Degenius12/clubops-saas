import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface ClubState {
  name: string
  subdomain: string
  settings: Record<string, any>
  isLoading: boolean
  error: string | null
}

const initialState: ClubState = {
  name: '',
  subdomain: '',
  settings: {},
  isLoading: false,
  error: null,
}

const clubSlice = createSlice({
  name: 'club',
  initialState,
  reducers: {
    setClubInfo: (state, action: PayloadAction<{ name: string; subdomain: string }>) => {
      state.name = action.payload.name
      state.subdomain = action.payload.subdomain
    },
    updateSettings: (state, action: PayloadAction<Record<string, any>>) => {
      state.settings = { ...state.settings, ...action.payload }
    }
  },
})

export const { setClubInfo, updateSettings } = clubSlice.actions
export default clubSlice.reducer
