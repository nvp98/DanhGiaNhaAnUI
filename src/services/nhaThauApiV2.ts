import { apiSliceV2 } from './apiSliceV2';
import NhaThauModel from '../models/NhaThauModel';

export interface NhaThauRequestV2 {
    ma: string;
    ten: string;
    ngayBatDauHd?: string;
    ngayKetThucHd?: string;
    trangThai: string;
}

export interface DanhSachNhaThauParamsV2 {
    trangThai?: string;
}

export const nhaThauApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachNhaThau: builder.query<NhaThauModel[], DanhSachNhaThauParamsV2 | void>({
            query: (params) => ({ url: '/nha-thau', params: params ?? {} }),
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'NhaThau' as const, id })), { type: 'NhaThau' as const, id: 'LIST' }]
                    : [{ type: 'NhaThau' as const, id: 'LIST' }],
        }),
        themNhaThau: builder.mutation<NhaThauModel, NhaThauRequestV2>({
            query: (body) => ({ url: '/nha-thau', method: 'POST', body }),
            invalidatesTags: [{ type: 'NhaThau', id: 'LIST' }],
        }),
        suaNhaThau: builder.mutation<NhaThauModel, { id: number; body: NhaThauRequestV2 }>({
            query: ({ id, body }) => ({ url: `/nha-thau/${id}`, method: 'PUT', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'NhaThau', id }, { type: 'NhaThau', id: 'LIST' }],
        }),
        xoaNhaThau: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/nha-thau/${id}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'NhaThau', id }, { type: 'NhaThau', id: 'LIST' }],
        }),
    }),
});

export const {
    useDanhSachNhaThauQuery,
    useThemNhaThauMutation,
    useSuaNhaThauMutation,
    useXoaNhaThauMutation,
} = nhaThauApiV2;
