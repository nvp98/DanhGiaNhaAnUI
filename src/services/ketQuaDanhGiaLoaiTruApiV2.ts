import { apiSliceV2 } from './apiSliceV2';
import KetQuaDanhGiaLoaiTruModel, { KetQuaDanhGiaLoaiTruRequestV2 } from '../models/KetQuaDanhGiaLoaiTruModel';

export interface DanhSachKetQuaDanhGiaLoaiTruParamsV2 {
    diaDiemNhaAnId?: number;
    idBuaAn?: number;
    tuNgay?: string;
    denNgay?: string;
}

// Đánh dấu (Ngày, Bữa ăn, Địa điểm) máy kiosk hỏng — xem
// KetQuaDanhGiaLoaiTruPageV2.tsx.
export const ketQuaDanhGiaLoaiTruApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachKetQuaDanhGiaLoaiTru: builder.query<KetQuaDanhGiaLoaiTruModel[], DanhSachKetQuaDanhGiaLoaiTruParamsV2 | void>({
            query: (params) => ({ url: '/KetQuaDanhGiaLoaiTru', params: params ?? {} }),
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'KetQuaDanhGiaLoaiTru' as const, id })), { type: 'KetQuaDanhGiaLoaiTru' as const, id: 'LIST' }]
                    : [{ type: 'KetQuaDanhGiaLoaiTru' as const, id: 'LIST' }],
        }),
        themKetQuaDanhGiaLoaiTru: builder.mutation<KetQuaDanhGiaLoaiTruModel, KetQuaDanhGiaLoaiTruRequestV2>({
            query: (body) => ({ url: '/KetQuaDanhGiaLoaiTru', method: 'POST', body }),
            invalidatesTags: [{ type: 'KetQuaDanhGiaLoaiTru', id: 'LIST' }],
        }),
        xoaKetQuaDanhGiaLoaiTru: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/KetQuaDanhGiaLoaiTru/${id}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'KetQuaDanhGiaLoaiTru', id }, { type: 'KetQuaDanhGiaLoaiTru', id: 'LIST' }],
        }),
    }),
});

export const {
    useDanhSachKetQuaDanhGiaLoaiTruQuery,
    useThemKetQuaDanhGiaLoaiTruMutation,
    useXoaKetQuaDanhGiaLoaiTruMutation,
} = ketQuaDanhGiaLoaiTruApiV2;
