import { combineReducers } from 'redux'
import { configureStore } from '@reduxjs/toolkit'
import currentUserSlice from '@/redux/slices/current-user.slice'
import envConfig from '@/config'

const rootReducer = combineReducers({
  [currentUserSlice.name]: currentUserSlice.reducer
})

const store = configureStore({
  reducer: rootReducer,
  devTools: envConfig.NODE_ENV === 'development'
})

export default store

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
