import { createSlice } from '@reduxjs/toolkit'
import type { TProfile } from '@/models/profile.model'
import { getLocalStorage } from '@/utils'

export interface ICurrentUserState {
  currentUser: TProfile | null
}

const storedUser = getLocalStorage('currentUser') as TProfile | null

const initialState: ICurrentUserState = {
  currentUser: storedUser ?? null
}

const currentUserSlice = createSlice({
  name: 'currentUser',
  initialState,
  reducers: {
    setCurrentUser: (state, action: { payload: TProfile | null }) => {
      state.currentUser = action.payload
    },
    removeCurrentUser: (state) => {
      state.currentUser = null
    }
  }
})

export const { setCurrentUser, removeCurrentUser } = currentUserSlice.actions
export default currentUserSlice
