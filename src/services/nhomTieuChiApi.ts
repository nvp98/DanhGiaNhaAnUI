import { apiSliceV2 } from './apiSliceV2';
import NhomTieuChiModel from '../models/NhomTieuChiModel';

export interface NhomTieuChiRequest {
    loaiPhieu: string;
    ma?: string;
    ten: string;
    thuTu: number;
    dangHoatDong: boolean;
}

export interface DanhSachNhomTieuChiParams {
    loaiPhieu?: string;
    dangHoatDong?: boolean;
}

export const nhomTieuChiApi = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachNhomTieuChi: builder.query<NhomTieuChiModel[], DanhSachNhomTieuChiParams | void>({
            query: (params) => ({ url: '/nhom-tieu-chi', params: params ?? {} }),
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'NhomTieuChi' as const, id })), { type: 'NhomTieuChi' as const, id: 'LIST' }]
                    : [{ type: 'NhomTieuChi' as const, id: 'LIST' }],
        }),
        themNhomTieuChi: builder.mutation<NhomTieuChiModel, NhomTieuChiRequest>({
            query: (body) => ({ url: '/nhom-tieu-chi', method: 'POST', body }),
            invalidatesTags: [{ type: 'NhomTieuChi', id: 'LIST' }],
        }),
        suaNhomTieuChi: builder.mutation<NhomTieuChiModel, { id: number; body: NhomTieuChiRequest }>({
            query: ({ id, body }) => ({ url: `/nhom-tieu-chi/${id}`, method: 'PUT', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'NhomTieuChi', id }, { type: 'NhomTieuChi', id: 'LIST' }],
        }),
        xoaNhomTieuChi: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/nhom-tieu-chi/${id}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'NhomTieuChi', id }, { type: 'NhomTieuChi', id: 'LIST' }],
        }),
    }),
});

export const {
    useDanhSachNhomTieuChiQuery,
    useThemNhomTieuChiMutation,
    useSuaNhomTieuChiMutation,
    useXoaNhomTieuChiMutation,
} = nhomTieuChiApi;
