import { apiSliceV2 } from './apiSliceV2';
import { loginV2, logoutV2 } from '../store/authV2Slice';
import NguoiDungModel from '../models/NguoiDungModel';

export interface DangNhapPayloadV2 {
    tenDangNhap: string;
    matKhau: string;
}

export interface DangNhapResponseV2 {
    token: string;
    hetHan: string;
    nguoiDung: NguoiDungModel;
}

export interface DangKyPayloadV2 {
    tenDangNhap: string;
    matKhau: string;
    hoTen: string;
    email?: string;
    soDienThoai?: string;
    phongBanId?: number;
    nhaThauId?: number;
}

export const authApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        dangNhapV2: builder.mutation<DangNhapResponseV2, DangNhapPayloadV2>({
            query: (body) => ({ url: '/auth/dang-nhap', method: 'POST', body }),
            onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
                const { data } = await queryFulfilled;
                dispatch(loginV2({ token: data.token, hetHan: data.hetHan, nguoiDung: data.nguoiDung }));
            },
        }),
        dangKyV2: builder.mutation<{ message: string }, DangKyPayloadV2>({
            query: (body) => ({ url: '/auth/dang-ky', method: 'POST', body }),
        }),
        dangXuatV2: builder.mutation<{ message: string }, void>({
            query: () => ({ url: '/auth/dang-xuat', method: 'POST' }),
            onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;
                } finally {
                    dispatch(logoutV2());
                }
            },
        }),
    }),
});

export const { useDangNhapV2Mutation, useDangKyV2Mutation, useDangXuatV2Mutation } = authApiV2;
