import { apiSliceV2 } from './apiSliceV2';
import VaiTroModel from '../models/VaiTroModel';

export interface VaiTroRequestV2 {
    ma: string;
    ten: string;
    coQuyenDuyetTk: boolean;
}

export const vaiTroApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachVaiTro: builder.query<VaiTroModel[], void>({
            query: () => '/vai-tro',
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'VaiTro' as const, id })), { type: 'VaiTro' as const, id: 'LIST' }]
                    : [{ type: 'VaiTro' as const, id: 'LIST' }],
        }),
        themVaiTro: builder.mutation<VaiTroModel, VaiTroRequestV2>({
            query: (body) => ({ url: '/vai-tro', method: 'POST', body }),
            invalidatesTags: [{ type: 'VaiTro', id: 'LIST' }],
        }),
        suaVaiTro: builder.mutation<VaiTroModel, { id: number; body: VaiTroRequestV2 }>({
            query: ({ id, body }) => ({ url: `/vai-tro/${id}`, method: 'PUT', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'VaiTro', id }, { type: 'VaiTro', id: 'LIST' }],
        }),
        xoaVaiTro: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/vai-tro/${id}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'VaiTro', id }, { type: 'VaiTro', id: 'LIST' }],
        }),
    }),
});

export const {
    useDanhSachVaiTroQuery,
    useThemVaiTroMutation,
    useSuaVaiTroMutation,
    useXoaVaiTroMutation,
} = vaiTroApiV2;
