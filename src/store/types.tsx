import { PersistPartial } from 'redux-persist/es/persistReducer'
import { ShowMenuState } from './ShowMenuSlide'
import { NhaAnState } from './NhaAnSlice'

export interface RootState {
  root: RootType & PersistPartial
}
export interface RootType {
  auth: AuthState,
  notify: NotifyState,
  showMenu: ShowMenuState,
  nhaAn: NhaAnState
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
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


export interface Permission {
  chucnang: {
    view: boolean;
    insert: boolean;
    update: boolean;
  };
  diadiem: {
    view: boolean;
    insert: boolean;
    update: boolean;
  };
  kehoach: {
    view: boolean;
    insert: boolean;
    update: boolean;
  };
  nhanvien: {
    view: boolean;
    insert: boolean;
    update: boolean;
  };
  tuankiem: {
    view: boolean;
    insert: boolean;
    update: boolean;
  };
  vaitro: {
    view: boolean;
    insert: boolean;
    update: boolean;
  };
}
export interface VaiTro {
  id: number;
  tenVaiTro: string;
  trangThai: number;
}


export interface User {
  id: number;
  maNv: string;
  hoTen: string;
  email: string;
  boPhan: string;
  viTriCongViec: string;
  idVaiTro: number;
  vaiTro: VaiTro;
  trangThai: number;
  refreshToken: string;
  tokenExpired: string;
  permission: Permission;
  token: string
  timesave: any
}