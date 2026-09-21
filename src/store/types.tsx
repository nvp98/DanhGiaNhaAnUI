import { PersistPartial } from 'redux-persist/es/persistReducer'
import { NhaAnState } from './NhaAnSlice'
import { AuthV2State } from './authV2Slice'

export interface RootState {
  root: RootType & PersistPartial
}
export interface RootType {
  notify: NotifyState,
  nhaAn: NhaAnState,
  authV2: AuthV2State
}

export interface LoadState {
  isLoading: boolean
}

interface NotifyState {
  isNotify: boolean;
  typeNotify: 'success' | 'info' | 'warning' | 'error';
  titleNotify: string,
  messageNotify: string
}