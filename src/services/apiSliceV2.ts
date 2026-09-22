import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import LinkServerV2 from './LinkServerV2';
import { RootType } from '../store/types';
import { logoutV2 } from '../store/authV2Slice';
import { setNotify } from '../store/notifycationSlide';

const rawBaseQuery = fetchBaseQuery({
    baseUrl: LinkServerV2,
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootType).authV2.token;
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

// Bắt lỗi 401 ở 1 chỗ duy nhất thay vì để từng trang tự xử lý (trước đây
// không có, nên khi hết hạn/token không hợp lệ, các trang chỉ hiện lỗi
// chung chung ("Lưu thất bại"...) hoặc không hiện gì — người dùng không
// hiểu vì sao thao tác thất bại. Ở đây: tự đăng xuất + điều hướng về trang
// đăng nhập V2 kèm thông báo dễ hiểu.
// Bỏ qua endpoint dang-nhap vì 401 ở đó nghĩa là sai tên đăng nhập/mật khẩu
// (xem AuthService.DangNhapAsync), không phải hết phiên — DangNhapPageV2 đã
// tự hiện đúng thông báo cho case này, không được ghi đè.
const baseQueryWith401Handler: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
        const url = typeof args === 'string' ? args : args.url;
        const laDangNhap = url.includes('/auth/dang-nhap');

        if (!laDangNhap) {
            const dangDaDangNhap = (api.getState() as RootType).authV2.isAuthenticated;
            api.dispatch(logoutV2());

            // Ghép với BASE_URL (theo VITE_BASE_PATH của từng môi trường, xem
            // main.tsx/publicAsset.ts) vì đây là window.location trực tiếp,
            // không đi qua basename của react-router.
            const duongDanDangNhap = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/v2/dang-nhap`;

            if (dangDaDangNhap && !window.location.pathname.startsWith(duongDanDangNhap)) {
                api.dispatch(setNotify({
                    typeNotify: 'warning',
                    titleNotify: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
                    messageNotify: '',
                }));
                window.location.href = duongDanDangNhap;
            }
        }
    }

    return result;
};

// 1 apiSlice dùng chung cho toàn bộ module V2, mỗi entity "inject" endpoint
// riêng qua apiSliceV2.injectEndpoints() (xem bepAnApiV2.ts, nhaThauApiV2.ts...)
// — pattern chuẩn của RTK Query để tách file theo feature mà vẫn dùng chung
// 1 cache/store slice.
export const apiSliceV2 = createApi({
    reducerPath: 'apiV2',
    baseQuery: baseQueryWith401Handler,
    tagTypes: ['BepAn', 'NhaThau', 'DiaDiemNhaAn', 'VaiTro', 'Quyen', 'PhongBan', 'NguoiDung', 'ChuKy', 'NhomTieuChi', 'TieuChi', 'MauLuongKy', 'ChuKyPhieu', 'Phieu1', 'Phieu2', 'Phieu3', 'Phieu4'],
    endpoints: () => ({}),
});
