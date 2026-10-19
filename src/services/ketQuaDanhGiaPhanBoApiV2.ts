import { apiSliceV2 } from './apiSliceV2';
import KetQuaDanhGiaPhanBoModel from '../models/KetQuaDanhGiaPhanBoModel';

export interface DanhSachKetQuaDanhGiaPhanBoParamsV2 {
    diaDiemNhaAnId?: number;
    idBuaAn?: number;
    tuNgay?: string;
    denNgay?: string;
    // true = chỉ "Đã co giãn" (Tong != TongGoc), false = chỉ "Giữ nguyên"
    // (Tong == TongGoc), bỏ trống = không lọc theo trạng thái.
    daCoGian?: boolean;
}

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
        danhSachKetQuaDanhGiaPhanBo: builder.query<KetQuaDanhGiaPhanBoModel[], DanhSachKetQuaDanhGiaPhanBoParamsV2 | void>({
            query: (params) => ({ url: '/KetQuaDanhGiaPhanBo', params: params ?? {} }),
            providesTags: [{ type: 'KetQuaDanhGiaPhanBo', id: 'LIST' }],
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
    useTinhLaiKhoangKetQuaDanhGiaPhanBoMutation,
} = ketQuaDanhGiaPhanBoApiV2;
