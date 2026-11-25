import { apiSliceV2 } from './apiSliceV2';
import PagedResultModel from '../models/PagedResultModel';
import KetQuaDanhGiaLoaiTruModel, { KetQuaDanhGiaLoaiTruRequestV2 } from '../models/KetQuaDanhGiaLoaiTruModel';

export interface DanhSachKetQuaDanhGiaLoaiTruParamsV2 {
    // Bỏ trống/mảng rỗng -> tất cả địa điểm (xem Select mode="multiple" ở
    // KetQuaDanhGiaLoaiTruPageV2.tsx). Serialize thành chuỗi phân tách bằng
    // dấu phẩy qua URLSearchParams — ASP.NET Core model-bind List<int> hỗ trợ
    // sẵn dạng "1,2,3" cho query string (xem KetQuaDanhGiaLoaiTruController).
    diaDiemNhaAnIds?: number[];
    idBuaAn?: number;
    tuNgay?: string;
    denNgay?: string;
    page?: number;
    pageSize?: number;
}

// Params cho GET /xuat-excel — kế thừa đúng bộ lọc trên nhưng KHÔNG phân
// trang (server trả thẳng List, không PagedResultModel).
export type XuatKetQuaDanhGiaLoaiTruParamsV2 = Omit<DanhSachKetQuaDanhGiaLoaiTruParamsV2, 'page' | 'pageSize'>;

// Đánh dấu (Ngày, Bữa ăn, Địa điểm) máy kiosk hỏng — xem
// KetQuaDanhGiaLoaiTruPageV2.tsx.
export const ketQuaDanhGiaLoaiTruApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachKetQuaDanhGiaLoaiTru: builder.query<PagedResultModel<KetQuaDanhGiaLoaiTruModel>, DanhSachKetQuaDanhGiaLoaiTruParamsV2 | void>({
            query: (params) => ({ url: '/KetQuaDanhGiaLoaiTru', params: params ?? {} }),
            providesTags: (result) =>
                result
                    ? [...result.items.map(({ id }) => ({ type: 'KetQuaDanhGiaLoaiTru' as const, id })), { type: 'KetQuaDanhGiaLoaiTru' as const, id: 'LIST' }]
                    : [{ type: 'KetQuaDanhGiaLoaiTru' as const, id: 'LIST' }],
        }),
        // Dùng cho nút "Xuất Excel" — kế thừa đúng điều kiện lọc nhưng
        // KHÔNG phân trang (lấy toàn bộ kết quả khớp bộ lọc), xem
        // KetQuaDanhGiaLoaiTruController.DanhSachXuat.
        xuatKetQuaDanhGiaLoaiTru: builder.query<KetQuaDanhGiaLoaiTruModel[], XuatKetQuaDanhGiaLoaiTruParamsV2 | void>({
            query: (params) => ({ url: '/KetQuaDanhGiaLoaiTru/xuat-excel', params: params ?? {} }),
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
    // useLazy...: gọi tay (không tự fetch theo args thay đổi) — dùng cho nút
    // "Xuất Excel" ở KetQuaDanhGiaLoaiTruPageV2.tsx, lấy dữ liệu MỚI NHẤT
    // theo đúng điều kiện lọc tại thời điểm bấm xuất, không dùng lại dữ liệu
    // đang hiển thị trên bảng — và KHÔNG phân trang (endpoint riêng).
    useLazyXuatKetQuaDanhGiaLoaiTruQuery,
    useThemKetQuaDanhGiaLoaiTruMutation,
    useXoaKetQuaDanhGiaLoaiTruMutation,
} = ketQuaDanhGiaLoaiTruApiV2;
