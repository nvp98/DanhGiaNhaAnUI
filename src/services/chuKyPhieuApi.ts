import { apiSliceV2 } from './apiSliceV2';
import ChuKyPhieuModel from '../models/ChuKyPhieuModel';

export interface TienDoKyParams {
    loaiDoiTuong: string;
    doiTuongId: number;
}

export interface KyPhieuRequest {
    chuKyId?: number;
    ghiChu?: string;
}

export interface TuChoiPhieuRequest {
    ghiChu: string;
}

export const chuKyPhieuApi = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        tienDoKy: builder.query<ChuKyPhieuModel[], TienDoKyParams>({
            query: (params) => ({ url: '/chu-ky-phieu', params }),
            providesTags: (result, _error, params) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'ChuKyPhieu' as const, id })), { type: 'ChuKyPhieu' as const, id: `LIST-${params.loaiDoiTuong}-${params.doiTuongId}` }]
                    : [{ type: 'ChuKyPhieu' as const, id: `LIST-${params.loaiDoiTuong}-${params.doiTuongId}` }],
        }),
        trangThaiTongKy: builder.query<{ trangThai: string }, TienDoKyParams>({
            query: (params) => ({ url: '/chu-ky-phieu/trang-thai', params }),
        }),
        kyPhieu: builder.mutation<ChuKyPhieuModel, { id: number; loaiDoiTuong: string; doiTuongId: number; body: KyPhieuRequest }>({
            query: ({ id, body }) => ({ url: `/chu-ky-phieu/${id}/ky`, method: 'POST', body }),
            invalidatesTags: (_result, _error, { loaiDoiTuong, doiTuongId }) => [{ type: 'ChuKyPhieu', id: `LIST-${loaiDoiTuong}-${doiTuongId}` }],
        }),
        tuChoiPhieu: builder.mutation<ChuKyPhieuModel, { id: number; loaiDoiTuong: string; doiTuongId: number; body: TuChoiPhieuRequest }>({
            query: ({ id, body }) => ({ url: `/chu-ky-phieu/${id}/tu-choi`, method: 'POST', body }),
            invalidatesTags: (_result, _error, { loaiDoiTuong, doiTuongId }) => [{ type: 'ChuKyPhieu', id: `LIST-${loaiDoiTuong}-${doiTuongId}` }],
        }),
    }),
});

export const {
    useTienDoKyQuery,
    useTrangThaiTongKyQuery,
    useKyPhieuMutation,
    useTuChoiPhieuMutation,
} = chuKyPhieuApi;
