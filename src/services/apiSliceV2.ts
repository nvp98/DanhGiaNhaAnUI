import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import LinkServerV2 from './LinkServerV2';
import { RootType } from '../store/types';

// 1 apiSlice dùng chung cho toàn bộ module V2, mỗi entity "inject" endpoint
// riêng qua apiSliceV2.injectEndpoints() (xem bepAnApiV2.ts, nhaThauApiV2.ts...)
// — pattern chuẩn của RTK Query để tách file theo feature mà vẫn dùng chung
// 1 cache/store slice.
export const apiSliceV2 = createApi({
    reducerPath: 'apiV2',
    baseQuery: fetchBaseQuery({
        baseUrl: LinkServerV2,
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootType).authV2.token;
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['BepAn', 'NhaThau', 'VaiTro', 'PhongBan', 'NguoiDung', 'ChuKy', 'NhomTieuChi', 'TieuChi', 'MauLuongKy', 'ChuKyPhieu', 'Phieu1', 'Phieu2', 'Phieu3', 'Phieu4'],
    endpoints: () => ({}),
});
