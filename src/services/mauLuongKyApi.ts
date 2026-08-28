import { apiSliceV2 } from './apiSliceV2';
import MauLuongKyModel from '../models/MauLuongKyModel';

export interface MauLuongKyRequest {
    loaiPhieu: string;
    buocThuTu: number;
    tenBuoc: string;
    loaiNguoiKy: string;
    phongBanId?: number;
    vaiTroId?: number;
    batBuoc: boolean;
}

export interface DanhSachMauLuongKyParams {
    loaiPhieu?: string;
}

export const mauLuongKyApi = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachMauLuongKy: builder.query<MauLuongKyModel[], DanhSachMauLuongKyParams | void>({
            query: (params) => ({ url: '/mau-luong-ky', params: params ?? {} }),
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'MauLuongKy' as const, id })), { type: 'MauLuongKy' as const, id: 'LIST' }]
                    : [{ type: 'MauLuongKy' as const, id: 'LIST' }],
        }),
        themMauLuongKy: builder.mutation<MauLuongKyModel, MauLuongKyRequest>({
            query: (body) => ({ url: '/mau-luong-ky', method: 'POST', body }),
            invalidatesTags: [{ type: 'MauLuongKy', id: 'LIST' }],
        }),
        suaMauLuongKy: builder.mutation<MauLuongKyModel, { id: number; body: MauLuongKyRequest }>({
            query: ({ id, body }) => ({ url: `/mau-luong-ky/${id}`, method: 'PUT', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'MauLuongKy', id }, { type: 'MauLuongKy', id: 'LIST' }],
        }),
        xoaMauLuongKy: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/mau-luong-ky/${id}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'MauLuongKy', id }, { type: 'MauLuongKy', id: 'LIST' }],
        }),
    }),
});

export const {
    useDanhSachMauLuongKyQuery,
    useThemMauLuongKyMutation,
    useSuaMauLuongKyMutation,
    useXoaMauLuongKyMutation,
} = mauLuongKyApi;
