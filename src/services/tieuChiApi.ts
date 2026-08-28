import { apiSliceV2 } from './apiSliceV2';
import TieuChiModel from '../models/TieuChiModel';

export interface TieuChiRequest {
    nhomId?: number;
    noiDung: string;
    thuTu: number;
    macDinh: boolean;
    dangHoatDong: boolean;
}

export interface DanhSachTieuChiParams {
    nhomId?: number;
    dangHoatDong?: boolean;
}

export const tieuChiApi = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachTieuChi: builder.query<TieuChiModel[], DanhSachTieuChiParams | void>({
            query: (params) => ({ url: '/tieu-chi', params: params ?? {} }),
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'TieuChi' as const, id })), { type: 'TieuChi' as const, id: 'LIST' }]
                    : [{ type: 'TieuChi' as const, id: 'LIST' }],
        }),
        themTieuChi: builder.mutation<TieuChiModel, TieuChiRequest>({
            query: (body) => ({ url: '/tieu-chi', method: 'POST', body }),
            invalidatesTags: [{ type: 'TieuChi', id: 'LIST' }],
        }),
        suaTieuChi: builder.mutation<TieuChiModel, { id: number; body: TieuChiRequest }>({
            query: ({ id, body }) => ({ url: `/tieu-chi/${id}`, method: 'PUT', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'TieuChi', id }, { type: 'TieuChi', id: 'LIST' }],
        }),
        xoaTieuChi: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/tieu-chi/${id}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'TieuChi', id }, { type: 'TieuChi', id: 'LIST' }],
        }),
    }),
});

export const {
    useDanhSachTieuChiQuery,
    useThemTieuChiMutation,
    useSuaTieuChiMutation,
    useXoaTieuChiMutation,
} = tieuChiApi;
