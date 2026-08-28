import { apiSliceV2 } from './apiSliceV2';
import PhongBanModel from '../models/PhongBanModel';

export interface PhongBanRequestV2 {
    ma: string;
    ten: string;
    dangHoatDong: boolean;
}

export interface DanhSachPhongBanParamsV2 {
    dangHoatDong?: boolean;
}

export const phongBanApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachPhongBan: builder.query<PhongBanModel[], DanhSachPhongBanParamsV2 | void>({
            query: (params) => ({ url: '/phong-ban', params: params ?? {} }),
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'PhongBan' as const, id })), { type: 'PhongBan' as const, id: 'LIST' }]
                    : [{ type: 'PhongBan' as const, id: 'LIST' }],
        }),
        themPhongBan: builder.mutation<PhongBanModel, PhongBanRequestV2>({
            query: (body) => ({ url: '/phong-ban', method: 'POST', body }),
            invalidatesTags: [{ type: 'PhongBan', id: 'LIST' }],
        }),
        suaPhongBan: builder.mutation<PhongBanModel, { id: number; body: PhongBanRequestV2 }>({
            query: ({ id, body }) => ({ url: `/phong-ban/${id}`, method: 'PUT', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'PhongBan', id }, { type: 'PhongBan', id: 'LIST' }],
        }),
        xoaPhongBan: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/phong-ban/${id}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'PhongBan', id }, { type: 'PhongBan', id: 'LIST' }],
        }),
    }),
});

export const {
    useDanhSachPhongBanQuery,
    useThemPhongBanMutation,
    useSuaPhongBanMutation,
    useXoaPhongBanMutation,
} = phongBanApiV2;
