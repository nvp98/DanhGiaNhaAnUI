import { apiSliceV2 } from './apiSliceV2';
import ChuKyModel from '../models/ChuKyModel';

export const chuKyApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachChuKy: builder.query<ChuKyModel[], void>({
            query: () => '/chu-ky',
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'ChuKy' as const, id })), { type: 'ChuKy' as const, id: 'LIST' }]
                    : [{ type: 'ChuKy' as const, id: 'LIST' }],
        }),
        uploadChuKy: builder.mutation<ChuKyModel, File>({
            query: (file) => {
                const formData = new FormData();
                formData.append('file', file);
                return { url: '/chu-ky', method: 'POST', body: formData };
            },
            invalidatesTags: [{ type: 'ChuKy', id: 'LIST' }],
        }),
        kichHoatChuKy: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/chu-ky/${id}/kich-hoat`, method: 'POST' }),
            invalidatesTags: [{ type: 'ChuKy', id: 'LIST' }],
        }),
        xoaChuKy: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/chu-ky/${id}`, method: 'DELETE' }),
            invalidatesTags: [{ type: 'ChuKy', id: 'LIST' }],
        }),
    }),
});

export const {
    useDanhSachChuKyQuery,
    useUploadChuKyMutation,
    useKichHoatChuKyMutation,
    useXoaChuKyMutation,
} = chuKyApiV2;
