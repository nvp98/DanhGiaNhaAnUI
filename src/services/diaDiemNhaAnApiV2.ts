import { apiSliceV2 } from './apiSliceV2';
import NhaAnModel from '../models/NhaAnModel';

// DiaDiemNhaAn = bảng "nhà ăn" (điểm ăn) có sẵn từ hệ thống chấm điểm bữa ăn
// cũ (LocationController, route "/Location") — Phiếu 2 dùng lại danh mục này
// làm Nhà ăn thay vì tạo bảng master data mới (đã xác nhận nghiệp vụ
// 2026-08-27, xem 02. Phantich/modules/Phieu2_DanhGiaSuatAn.md). Gọi qua
// apiSliceV2 (base LinkServerV2) vì LocationController nằm trong cùng
// DanhGiaAPI với module Phiếu 1-4, khác domain cứng ở acctions/LinkServer.tsx
// mà trang HomePage cũ đang dùng.
export interface DiaDiemNhaAnRequestV2 {
    diaDiem: string;
    codeDiemAn?: string;
    isActive: boolean;
}

export interface DanhSachDiaDiemNhaAnParamsV2 {
    isActive?: boolean;
}

export const diaDiemNhaAnApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachDiaDiemNhaAn: builder.query<NhaAnModel[], DanhSachDiaDiemNhaAnParamsV2 | void>({
            query: (params) => ({ url: '/Location', params: params ?? {} }),
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'DiaDiemNhaAn' as const, id })), { type: 'DiaDiemNhaAn' as const, id: 'LIST' }]
                    : [{ type: 'DiaDiemNhaAn' as const, id: 'LIST' }],
        }),
        themDiaDiemNhaAn: builder.mutation<NhaAnModel, DiaDiemNhaAnRequestV2>({
            query: (body) => ({ url: '/Location', method: 'POST', body }),
            invalidatesTags: [{ type: 'DiaDiemNhaAn', id: 'LIST' }],
        }),
        suaDiaDiemNhaAn: builder.mutation<NhaAnModel, { id: number; body: DiaDiemNhaAnRequestV2 }>({
            query: ({ id, body }) => ({ url: `/Location/${id}`, method: 'PUT', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'DiaDiemNhaAn', id }, { type: 'DiaDiemNhaAn', id: 'LIST' }],
        }),
        xoaDiaDiemNhaAn: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/Location/${id}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'DiaDiemNhaAn', id }, { type: 'DiaDiemNhaAn', id: 'LIST' }],
        }),
    }),
});

export const {
    useDanhSachDiaDiemNhaAnQuery,
    useThemDiaDiemNhaAnMutation,
    useSuaDiaDiemNhaAnMutation,
    useXoaDiaDiemNhaAnMutation,
} = diaDiemNhaAnApiV2;
