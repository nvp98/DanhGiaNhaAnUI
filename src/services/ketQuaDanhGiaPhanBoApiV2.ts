import { apiSliceV2 } from './apiSliceV2';
import PagedResultModel from '../models/PagedResultModel';
import KetQuaDanhGiaPhanBoModel from '../models/KetQuaDanhGiaPhanBoModel';

export interface DanhSachKetQuaDanhGiaPhanBoParamsV2 {
    // Bỏ trống/mảng rỗng -> tất cả địa điểm — xem
    // DanhSachKetQuaDanhGiaLoaiTruParamsV2 (cùng cách serialize).
    diaDiemNhaAnIds?: number[];
    idBuaAn?: number;
    tuNgay?: string;
    denNgay?: string;
    // true = chỉ "Đã co giãn" (Tong != TongGoc), false = chỉ "Giữ nguyên"
    // (Tong == TongGoc), bỏ trống = không lọc theo trạng thái.
    daCoGian?: boolean;
    page?: number;
    pageSize?: number;
}

// Params cho GET /xuat-excel — kế thừa đúng bộ lọc trên nhưng KHÔNG phân
// trang (server trả thẳng List, không PagedResultModel).
export type XuatKetQuaDanhGiaPhanBoParamsV2 = Omit<DanhSachKetQuaDanhGiaPhanBoParamsV2, 'page' | 'pageSize'>;

// Body cho POST /KetQuaDanhGiaPhanBo/tinh-lai-khoang — "id_BuaAn" giữ đúng
// casing JSON BE mong đợi khi model-bind (System.Text.Json CamelCase chỉ hạ
// chữ đầu của "ID_BuaAn", xem KetQuaDanhGiaPhanBoModel.tsx).
export interface TinhLaiKhoangKetQuaDanhGiaPhanBoParamsV2 {
    tuNgay: string;
    denNgay: string;
    id_BuaAn?: number;
    diaDiemNhaAnId?: number;
}

export interface TinhLaiKhoangKetQuaDanhGiaPhanBoResultV2 {
    soToHopDaTinh: number;
    soToHopBoQua: number;
    tongDongGhi: number;
}

// Màn hình rà soát số liệu gốc (KetQuaDanhGia thô) vs đã phân bổ (khớp
// DuLieuCom.Com_ThucTe) — xem KetQuaDanhGiaPhanBoPageV2.tsx.
export const ketQuaDanhGiaPhanBoApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachKetQuaDanhGiaPhanBo: builder.query<PagedResultModel<KetQuaDanhGiaPhanBoModel>, DanhSachKetQuaDanhGiaPhanBoParamsV2 | void>({
            query: (params) => ({ url: '/KetQuaDanhGiaPhanBo', params: params ?? {} }),
            providesTags: [{ type: 'KetQuaDanhGiaPhanBo', id: 'LIST' }],
        }),
        // Dùng cho nút "Xuất Excel" — kế thừa đúng điều kiện lọc nhưng
        // KHÔNG phân trang (lấy toàn bộ kết quả khớp bộ lọc), xem
        // KetQuaDanhGiaPhanBoController.DanhSachXuat.
        xuatKetQuaDanhGiaPhanBo: builder.query<KetQuaDanhGiaPhanBoModel[], XuatKetQuaDanhGiaPhanBoParamsV2 | void>({
            query: (params) => ({ url: '/KetQuaDanhGiaPhanBo/xuat-excel', params: params ?? {} }),
        }),
        // Nút "Phân bổ lại" — gọi tay theo đúng bộ lọc đang chọn trên màn
        // search (BE giới hạn khoảng ngày tối đa 2 ngày, xem
        // KetQuaDanhGiaPhanBoController.TinhLaiKhoang).
        tinhLaiKhoangKetQuaDanhGiaPhanBo: builder.mutation<TinhLaiKhoangKetQuaDanhGiaPhanBoResultV2, TinhLaiKhoangKetQuaDanhGiaPhanBoParamsV2>({
            query: (body) => ({ url: '/KetQuaDanhGiaPhanBo/tinh-lai-khoang', method: 'POST', body }),
            invalidatesTags: [{ type: 'KetQuaDanhGiaPhanBo', id: 'LIST' }],
        }),
    }),
});

export const {
    useDanhSachKetQuaDanhGiaPhanBoQuery,
    // useLazy...: gọi tay (không tự fetch theo args thay đổi) — dùng cho nút
    // "Xuất Excel" ở KetQuaDanhGiaPhanBoPageV2.tsx, lấy dữ liệu MỚI NHẤT theo
    // đúng điều kiện lọc tại thời điểm bấm xuất, không dùng lại dữ liệu đang
    // hiển thị trên bảng — và KHÔNG phân trang (endpoint riêng).
    useLazyXuatKetQuaDanhGiaPhanBoQuery,
    useTinhLaiKhoangKetQuaDanhGiaPhanBoMutation,
} = ketQuaDanhGiaPhanBoApiV2;
