import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import NguoiDungModel from '../models/NguoiDungModel';

export interface AuthV2State {
    isAuthenticated: boolean;
    token: string;
    hetHan: string;
    nguoiDung: NguoiDungModel | null;
}

export interface LoginV2Payload {
    token: string;
    hetHan: string;
    nguoiDung: NguoiDungModel;
}

const initialState: AuthV2State = {
    isAuthenticated: false,
    token: "",
    hetHan: "",
    nguoiDung: null
};

const authV2Slice = createSlice({
    name: 'authV2',
    initialState,
    reducers: {
        loginV2(state, action: PayloadAction<LoginV2Payload>) {
            state.isAuthenticated = true;
            state.token = action.payload.token;
            state.hetHan = action.payload.hetHan;
            state.nguoiDung = action.payload.nguoiDung;
        },
        logoutV2(state) {
            state.isAuthenticated = false;
            state.token = "";
            state.hetHan = "";
            state.nguoiDung = null;
        },
        capNhatThongTinV2(state, action: PayloadAction<{ hoTen: string; email?: string; soDienThoai?: string }>) {
            if (!state.nguoiDung) return;
            state.nguoiDung.hoTen = action.payload.hoTen;
            state.nguoiDung.email = action.payload.email;
            state.nguoiDung.soDienThoai = action.payload.soDienThoai;
        }
    }
});

export const { loginV2, logoutV2, capNhatThongTinV2 } = authV2Slice.actions;

export default authV2Slice.reducer;
