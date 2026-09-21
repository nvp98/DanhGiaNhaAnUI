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
                // Xóa cache RTK Query của phiên trước (nếu có) TRƯỚC khi ghi
                // nhận user mới — cache các query (tienDoKy, danhSachNguoiKyKhaDung...)
                // không có user/token trong key, nên nếu không xóa, đăng nhập
                // tài khoản khác trong cùng tab (không reload trang) sẽ đọc
                // nhầm dữ liệu cache của user cũ (VD tài khoản nhà thầu vào
                // sau khi tài khoản nội bộ vừa "Gửi ký" không thấy khung ký vì
                // tienDoKy còn cache cũ) cho tới khi F5.
                dispatch(apiSliceV2.util.resetApiState());
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
                    // Xem giải thích ở dangNhapV2 — xóa luôn cache khi đăng
                    // xuất để chắc chắn không rò rỉ sang phiên kế tiếp.
                    dispatch(apiSliceV2.util.resetApiState());
                }
            },
        }),
    }),
});

export const { useDangNhapV2Mutation, useDangKyV2Mutation, useDangXuatV2Mutation } = authApiV2;
