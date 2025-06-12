  import { createSlice, PayloadAction } from '@reduxjs/toolkit'
  import { User } from './types'

export interface AuthState {
    isAuthenticated: boolean
    user: User | null
  }

export const initialState: AuthState = {
    isAuthenticated: false,
    user:  {
      id: 0,
      maNv: "",
      hoTen: "",
      email: "",
      boPhan: "",
      viTriCongViec: "",
      idVaiTro: 0,
      vaiTro: {
        id: 0,
        tenVaiTro: "",
        trangThai: 0
      },
      trangThai: 0,
      refreshToken: "",
      tokenExpired: "",
      permission: {
        chucnang: {
          view: false,
          insert: false,
          update: false
        },
        diadiem: {
          view: false,
          insert: false,
          update: false
        },
        kehoach: {
          view: false,
          insert: false,
          update: false
        },
        nhanvien: {
          view: false,
          insert: false,
          update: false
        },
        tuankiem: {
          view: false,
          insert: false,
          update: false
        },
        vaitro: {
          view: false,
          insert: false,
          update: false
        }
      },
      timesave: "",
      token: ""
    }
  }

  const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
      login(state, action: PayloadAction<User>) {
        state.isAuthenticated = true
        state.user = action.payload
      },

      logout(state) {
        state.isAuthenticated = false
        state.user = null
      }
    }
  })

  export const { login, logout} = authSlice.actions

  
  export default authSlice.reducer;
