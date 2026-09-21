import { apiSliceV2 } from './apiSliceV2';
import { capNhatThongTinV2 } from '../store/authV2Slice';
import NguoiDungListItemModel from '../models/NguoiDungListItemModel';

export interface CapNhatProfileParamsV2 {
    hoTen: string;
    email?: string;
    soDienThoai?: string;
}

export interface DoiMatKhauParamsV2 {
    matKhauHienTai: string;
    matKhauMoi: string;
}

export const profileApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        // Hồ sơ CỦA CHÍNH MÌNH (khác chiTietNguoiDung ở nguoiDungApiV2 — đó là
        // Admin xem hồ sơ NGƯỜI KHÁC, cần quyền QUAN_LY_TAI_KHOAN). Dùng để
        // sidebar/TrangChu đọc danhSachLoaiPhieuDuocXem — gọi API riêng (không
        // nhét vào JWT/authV2.nguoiDung) để phân quyền theo Phiếu có hiệu lực
        // NGAY, không cần đăng xuất/đăng nhập lại (xem huongdanquanlytaikhoan.md).
        layHoSo: builder.query<NguoiDungListItemModel, void>({
            query: () => '/profile',
            providesTags: [{ type: 'NguoiDung', id: 'ME' }],
        }),
        capNhatProfile: builder.mutation<NguoiDungListItemModel, CapNhatProfileParamsV2>({
            query: (body) => ({ url: '/profile', method: 'PUT', body }),
            onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
                const { data } = await queryFulfilled;
                dispatch(capNhatThongTinV2({ hoTen: data.hoTen, email: data.email, soDienThoai: data.soDienThoai }));
            },
        }),
        doiMatKhau: builder.mutation<{ message: string }, DoiMatKhauParamsV2>({
            query: (body) => ({ url: '/profile/doi-mat-khau', method: 'POST', body }),
        }),
    }),
});

export const { useLayHoSoQuery, useCapNhatProfileMutation, useDoiMatKhauMutation } = profileApiV2;
