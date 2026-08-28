import { apiSliceV2 } from './apiSliceV2';
import BepAnModel from '../models/BepAnModel';

export interface BepAnRequestV2 {
    ma: string;
    ten: string;
    viTri?: string;
    nhaThauId?: number;
    trangThai: string;
}

export interface DanhSachBepAnParamsV2 {
    nhaThauId?: number;
    trangThai?: string;
}

export const bepAnApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachBepAn: builder.query<BepAnModel[], DanhSachBepAnParamsV2 | void>({
            query: (params) => ({ url: '/bep-an', params: params ?? {} }),
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'BepAn' as const, id })), { type: 'BepAn' as const, id: 'LIST' }]
                    : [{ type: 'BepAn' as const, id: 'LIST' }],
        }),
        themBepAn: builder.mutation<BepAnModel, BepAnRequestV2>({
            query: (body) => ({ url: '/bep-an', method: 'POST', body }),
            invalidatesTags: [{ type: 'BepAn', id: 'LIST' }],
        }),
        suaBepAn: builder.mutation<BepAnModel, { id: number; body: BepAnRequestV2 }>({
            query: ({ id, body }) => ({ url: `/bep-an/${id}`, method: 'PUT', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'BepAn', id }, { type: 'BepAn', id: 'LIST' }],
        }),
        xoaBepAn: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/bep-an/${id}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'BepAn', id }, { type: 'BepAn', id: 'LIST' }],
        }),
    }),
});

export const {
    useDanhSachBepAnQuery,
    useThemBepAnMutation,
    useSuaBepAnMutation,
    useXoaBepAnMutation,
} = bepAnApiV2;
